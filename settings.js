// === DOM 載入完成後初始化 ===
document.addEventListener("DOMContentLoaded", () => {
    // 同時載入 header 與 footer
    Promise.all([
        fetch('Sources/header_of_body.html').then(r => r.text()),
        fetch('Sources/footer_of_body.html').then(r => r.text())
    ])
        .then(([headerHTML, footerHTML]) => {
            // 插入 header
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = headerHTML;
                try { initLangSwitch(); } catch (e) { console.error("LangSwitch error:", e); }
            }

            // 插入 footer
            const footerPlaceholder = document.getElementById('footer-placeholder');
            if (footerPlaceholder) {
                footerPlaceholder.innerHTML = footerHTML;

                // 動態年份
                const startYear = 2025;
                const currentYear = new Date().getFullYear();
                const yearEl = document.getElementById("year");
                if (yearEl) {
                    yearEl.textContent =
                        startYear === currentYear ? `© ${startYear}` : `© ${startYear} - ${currentYear}`;
                }

                // 回到頂部按鈕顯示控制
                const backToTopBtn = document.querySelector(".back-to-top-btn");
                if (backToTopBtn) {
                    window.addEventListener("scroll", () => {
                        if (window.scrollY > 200) {
                            backToTopBtn.classList.add("show");
                        } else {
                            backToTopBtn.classList.remove("show");
                        }
                    });
                }
            }

            // header/footer 插入後再初始化相關功能
            requestAnimationFrame(() => {
                try { initQRModal(); } catch (e) { console.error("QRModal error:", e); }
                try { initMobileMenu(); } catch (e) { console.error("MobileMenu error:", e); }
                try { initHeaderScroll(); } catch (e) { console.error("HeaderScroll error:", e); }
                try { initMainOffset(); } catch (e) { console.error("MainOffset error:", e); }

                // 如果有歡迎畫面，處理動畫結束後移除
                const overlay = document.getElementById("welcome-screen");
                if (overlay) {
                    overlay.addEventListener("animationend", () => {
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    });
                }

                // 如果頁面上有輪播區塊，就初始化
                if (document.querySelector(".main-top-img-wrapper")) {
                    try { initLangSwitch(); } catch (e) { console.error("LangSwitch error:", e); }
                    try { initSlideshowWhenReady(); } catch (e) { console.error("Slideshow error:", e); }
                }
            });
        })
        .catch(error => console.error('載入 header/footer 失敗:', error));
});

// ================= 功能區 =================
// --- Header 捲動縮小效果 + main 與 header 距離調整 ---
function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    const onScroll = () => {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        requestAnimationFrame(adjustMainOffset);
    };

    window.addEventListener('scroll', onScroll);
    onScroll();
}

// --- main 與 header 高度自動對齊 ---
function initMainOffset() {
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    if (!header || !main) return;

    const apply = () => {
        main.style.paddingTop = (header.offsetHeight + 10) + 'px';
    };

    apply();
    window.addEventListener('resize', apply);

    if (window.ResizeObserver) {
        try {
            new ResizeObserver(apply).observe(header);
        } catch (e) {
            console.warn("ResizeObserver error:", e);
        }
    }
}

function adjustMainOffset() {
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    if (header && main) {
        main.style.paddingTop = (header.offsetHeight + 10) + 'px';
    }
}

// --- QR Code Modal 彈窗 ---
function initQRModal() {
    if (!document.getElementById("qr-modal")) {
        const modalHTML = `
          <div id="qr-modal" class="qr-modal">
            <div class="qr-modal-content">
              <span class="close">&times;</span>
              <h3>Welcome to RCT Lab.</h3>
              <img src="images/QR_Code.png" alt="QR Code">
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHTML);
    }

    const qrBtn = document.getElementById("qr-btn");
    const qrModal = document.getElementById("qr-modal");
    const closeBtn = qrModal ? qrModal.querySelector(".close") : null;

    if (qrBtn && qrModal && closeBtn) {
        qrBtn.addEventListener("click", () => qrModal.style.display = "flex");
        closeBtn.addEventListener("click", () => qrModal.style.display = "none");
        qrModal.addEventListener("click", (e) => {
            if (e.target === qrModal) qrModal.style.display = "none";
        });
    }
}

// --- 手機版漢堡選單 ---
function initMobileMenu() {
    const menuToggle = document.querySelector(".menu-toggle");
    const navMenu = document.querySelector(".nav ul");

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            navMenu.classList.toggle("show");
        });

        navMenu.addEventListener("click", (e) => e.stopPropagation());

        document.addEventListener("click", () => {
            if (navMenu.classList.contains("show")) {
                navMenu.classList.remove("show");
            }
        });
    }
}

// --- 首頁輪播圖：等圖片載入完成後再啟動 ---
function initSlideshowWhenReady() {
    const wrapper = document.querySelector(".main-top-img-wrapper");
    if (!wrapper) return;

    const imgs = wrapper.querySelectorAll("img");
    if (!imgs.length) {
        initSlideshow();
        return;
    }

    let loaded = 0;
    let started = false;

    const startSlideshow = () => {
        if (started) return;
        if (loaded === 0) return;
        started = true;
        initSlideshow(true);
    };

    imgs.forEach(img => {
        if (img.complete) {
            loaded++;
        } else {
            img.addEventListener("load", () => { loaded++; startSlideshow(); });
            img.addEventListener("error", () => { loaded++; startSlideshow(); });
        }
    });

    if (imgs[0].complete) {
        loaded++;
        startSlideshow();
    }
}

function initSlideshow(restart = false) {
    const slides = document.querySelectorAll(".main-top-img-wrapper .slide");
    const dotsContainer = document.querySelector(".main-top-img-wrapper .dots");

    if (!slides.length || !dotsContainer) return;

    if (restart) dotsContainer.innerHTML = "";

    let currentIndex = 0;
    let timer = null;

    // 建立指示點
    slides.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.classList.add("dot");
        dot.addEventListener("click", () => {
            showSlide(i);
            restartTimer();
        });
        dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll(".dot");

    function showSlide(index) {
        slides[currentIndex].classList.remove("active");
        dots[currentIndex].classList.remove("active");

        currentIndex = index;

        slides[currentIndex].classList.add("active");
        dots[currentIndex].classList.add("active");
    }

    function nextSlide() {
        let next = (currentIndex + 1) % slides.length;
        showSlide(next);
    }

    function restartTimer() {
        if (timer) clearInterval(timer);
        timer = setInterval(nextSlide, 4000);
    }

    showSlide(0);
    restartTimer();
}

// --- 語言切換（預設中文） ---
function initLangSwitch() {
    const btnZh = document.querySelectorAll(".btn-zh");
    const btnEn = document.querySelectorAll(".btn-en");

    // 如果按鈕不存在就直接跳過
    if (!btnZh.length || !btnEn.length) {
        console.warn("LangSwitch: 按鈕不存在，跳過初始化");
        return;
    }

    // 預設中文
    setLang("zh");

    // 綁定事件
    btnZh.forEach(btn => btn.addEventListener("click", () => setLang("zh")));
    btnEn.forEach(btn => btn.addEventListener("click", () => setLang("en")));

    function setLang(lang) {
        // 切換 body class
        document.body.classList.remove("lang-zh", "lang-en");
        document.body.classList.add("lang-" + lang);

        // 切換按鈕狀態
        btnZh.forEach(btn => btn.classList.toggle("active", lang === "zh"));
        btnEn.forEach(btn => btn.classList.toggle("active", lang === "en"));
    }
}

// 功能：只在 news.html 中，讓 .latest-news 區塊的連結自動開新視窗並提升安全性
document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname.endsWith('news.html')) {
        document.querySelectorAll('.latest-news a').forEach(function (link) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
    }
});

// 功能：只在 advisor.html 中控制內容切換
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.endsWith("advisor.html")) {
        const buttons = document.querySelectorAll("body.advisor .button-section button");
        const sections = document.querySelectorAll("body.advisor .content");

        // 將 template 插入到所有 .right-column
        const tpl = document.getElementById("right-column-template");
        if (tpl) {
            document.querySelectorAll(".right-column").forEach(col => {
                col.appendChild(tpl.content.cloneNode(true));
            });
        }

        // 按鈕切換功能
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("active"));
                sections.forEach(sec => sec.classList.remove("active"));

                btn.classList.add("active");
                const targetId = btn.getAttribute("data-target");
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add("active");
                }
            });
        });
    }
});

// 限定research.html
document.addEventListener("DOMContentLoaded", () => {
    // 僅在 research.html 執行
    if (!window.location.pathname.includes("research.html")) return;

    // === 語言切換功能 ===
    function initResearchLangSwitch() {
        const btnZh = document.querySelector("#btn-zh");
        const btnEn = document.querySelector("#btn-en");

        if (!btnZh || !btnEn) return;

        // 載入時套用上次選擇或預設中文
        const savedLang = localStorage.getItem("lang");
        setLang(savedLang === "en" ? "en" : "zh");

        // 綁定事件
        btnZh.addEventListener("click", () => setLang("zh"));
        btnEn.addEventListener("click", () => setLang("en"));

        function setLang(lang) {
            document.body.classList.remove("lang-zh", "lang-en");
            document.body.classList.add("lang-" + lang);
            localStorage.setItem("lang", lang);
            btnZh.classList.toggle("active", lang === "zh");
            btnEn.classList.toggle("active", lang === "en");
        }
    }

    // === Gallery Modal 功能 ===
    function initResearchGallery() {
        const modal = document.getElementById("details-modal");
        if (!modal) return; // 沒有 modal 就不執行

        const modalTitle = document.getElementById("modal-title");
        const modalText = document.getElementById("modal-text");

        document.querySelectorAll(".details-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                modalTitle.textContent = btn.dataset.title || "";
                modalText.innerHTML = btn.dataset.text || "";
                modal.classList.add("active");
            });
        });

        // 點擊背景關閉
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("active");
            }
        });

        // 按下 Esc 關閉
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                modal.classList.remove("active");
            }
        });
    }

    // 初始化
    initResearchLangSwitch();
    initResearchGallery();
});

// 功能：只在 members.html 動態生成 Alumni 下拉按鈕，並載入資料
document.addEventListener("DOMContentLoaded", () => {
    if (!window.location.pathname.endsWith("members.html")) return;

    // ===== Dropdown hover 行為（保險判斷，避免不存在時報錯）=====
    const dropdown = document.querySelector(".dropdown");
    if (dropdown) {
        const dropdownContent = dropdown.querySelector(".dropdown-content");
        dropdown.addEventListener("mouseenter", () => {
            dropdownContent.style.display = "block";
        });
        dropdown.addEventListener("mouseleave", () => {
            dropdownContent.style.display = "none";
        });
    }

    // ===== 資料容器 =====
    const gallery = document.getElementById("photo-gallery");
    const defaultImage = document.getElementById("default-image");

    // ===== Alumni 資料 =====
    let alumniData = {};
    fetch("Sources/Alumni_info.json")
        .then(res => res.json())
        .then(data => {
            alumniData = data;
            buildAlumniDropdown(alumniData); // 動態產生選單
        })
        .catch(err => console.error("載入 Alumni_info.json 失敗:", err));

    // ===== Current 資料 =====
    let currentData = {};
    fetch("Sources/Current_info.json")
        .then(res => res.json())
        .then(data => {
            currentData = data;
            bindCurrentButtons(); // 綁定顯示 Current 的按鈕
        })
        .catch(err => console.error("載入 Current_info.json 失敗:", err));

    // ===== 動態產生 Alumni 下拉按鈕 =====
    function buildAlumniDropdown(alumni) {
        const container = document.getElementById("alumni-dropdown");
        if (!container) return;
        container.innerHTML = "";

        // 取出 key，如 ["108","109","PhD", ...]
        const keys = Object.keys(alumni);

        // 分成數字屆與非數字（如 PhD），數字屆用降序排序
        const numericLevels = keys.filter(k => /^\d+$/.test(k)).map(Number).sort((a, b) => b - a);
        const nonNumeric = keys.filter(k => !/^\d+$/.test(k));

        // 先渲染數字屆，再渲染非數字（讓 PhD 在最後）
        numericLevels.forEach(level => {
            const btn = document.createElement("button");
            btn.className = "main-btn alumni-btn";
            btn.dataset.level = String(level);
            btn.textContent = `${level}級`;
            btn.addEventListener("click", () => {
                showPhotos(String(level));
                container.style.display = "none"; // 點擊後收起選單
            });
            container.appendChild(btn);
        });

        nonNumeric.forEach(level => {
            const btn = document.createElement("button");
            btn.className = "main-btn alumni-btn";
            btn.dataset.level = level;
            btn.textContent = level === "PhD" ? "Ph.D" : level;
            btn.addEventListener("click", () => {
                showPhotos(level);
                container.style.display = "none";
            });
            container.appendChild(btn);
        });
    }

    // ===== 綁定 Current 按鈕 =====
    function bindCurrentButtons() {
        const btnMS = document.getElementById("btn-show-ms");
        const btnPhD = document.getElementById("btn-show-phd");
        if (btnMS) btnMS.addEventListener("click", showAllMS);
        if (btnPhD) btnPhD.addEventListener("click", showAllPhD);
    }

    // ===== 顯示 Alumni 照片 =====
    function showPhotos(level) {
        if (defaultImage) defaultImage.style.display = "none";
        if (!gallery) return;
        gallery.innerHTML = "";

        const data = alumniData[level];
        if (!data) {
            gallery.innerHTML = `<p style="text-align:center; color:#999;">找不到 ${level} 的資料</p>`;
            return;
        }

        const title = document.createElement("h2");
        title.className = "gallery-title";
        title.textContent = (level === "PhD") ? "Ph.D" : `${level} 級`;
        gallery.appendChild(title);

        data.members.forEach(member => {
            const figure = document.createElement("figure");

            const img = document.createElement("img");
            img.src = `${data.folder}/${member.photo}`;
            img.alt = member.name;

            const caption = document.createElement("figcaption");
            caption.innerHTML = `<h3>${member.name}</h3><p>${member.desc}</p>`;

            figure.appendChild(img);
            figure.appendChild(caption);
            gallery.appendChild(figure);
        });
    }

    // ===== 顯示所有 M.S. =====
    function showAllMS() {
        if (defaultImage) defaultImage.style.display = "none";
        if (!gallery) return;
        gallery.innerHTML = "";

        // currentData.MS 形如：{ "108": { folder, members: [] }, "109": ... }
        const levels = Object.keys(currentData.MS || {}).sort((a, b) => Number(b) - Number(a));
        levels.forEach(level => {
            const data = currentData.MS[level];

            const title = document.createElement("h2");
            title.className = "gallery-title";
            title.textContent = `${level} 級`;
            gallery.appendChild(title);

            data.members.forEach(member => {
                const figure = document.createElement("figure");

                const img = document.createElement("img");
                img.src = `${data.folder}/${member.photo}`;
                img.alt = member.name;

                const caption = document.createElement("figcaption");
                caption.innerHTML = `<h3>${member.name}</h3><p>${member.desc}</p>`;

                figure.appendChild(img);
                figure.appendChild(caption);
                gallery.appendChild(figure);
            });
        });
    }

    // ===== 顯示所有 Ph.D =====
    function showAllPhD() {
        if (defaultImage) defaultImage.style.display = "none";
        if (!gallery) return;
        gallery.innerHTML = "";

        const data = currentData.PhD;
        if (!data) {
            gallery.innerHTML = `<p style="text-align:center; color:#999;">目前沒有 Ph.D 的資料</p>`;
            return;
        }

        data.members.forEach(member => {
            const figure = document.createElement("figure");

            const img = document.createElement("img");
            img.src = `${data.folder}/${member.photo}`;
            img.alt = member.name;

            const caption = document.createElement("figcaption");
            caption.innerHTML = `<h3>${member.name}</h3><p>${member.desc}</p>`;

            figure.appendChild(img);
            figure.appendChild(caption);
            gallery.appendChild(figure);
        });
    }
});

// ===== Album 相簿功能（只在 album.html 執行）=====
document.addEventListener("DOMContentLoaded", () => {
    if (!window.location.pathname.endsWith("album.html")) return;

    const albumRoot = document.getElementById("album-root");
    if (!albumRoot) return;

    let albumData = {};
    let currentYear = null;

    // 載入相簿 JSON
    fetch("Sources/Album_info.json")
        .then(res => res.json())
        .then(data => {
            albumData = data;
            if (Object.keys(albumData).length) {
                renderYearButtons();
            } else {
                albumRoot.innerHTML = "<p style='text-align:center;color:#999;'>沒有相簿資料</p>";
            }
        })
        .catch(err => console.error("載入 Album_info.json 失敗:", err));

    // 生成年份按鈕
    function renderYearButtons() {
        albumRoot.innerHTML = "";
        const btnContainer = document.createElement("div");
        btnContainer.className = "year-buttons";

        const years = Object.keys(albumData).sort((a, b) => b - a);
        years.forEach(year => {
            const btn = document.createElement("button");
            btn.textContent = year;
            btn.addEventListener("click", () => {
                currentYear = year;
                renderActivities(year);
                setActiveButton(btnContainer, btn);
            });
            btnContainer.appendChild(btn);
        });

        albumRoot.appendChild(btnContainer);

        // 預設顯示最新年份
        if (years.length) {
            currentYear = years[0];
            setActiveButton(btnContainer, btnContainer.querySelector("button"));
            renderActivities(years[0]);
        }
    }

    // 設定 active 樣式
    function setActiveButton(container, activeBtn) {
        container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        activeBtn.classList.add("active");
    }

    // 顯示該年份的活動封面
    function renderActivities(year) {
        clearGallery();
        const gallery = document.createElement("div");
        gallery.className = "gallery";

        Object.entries(albumData[year]).forEach(([activityName, photos]) => {
            const coverPhoto = photos.find(p => p.includes("(1)")) || photos[0];
            const item = document.createElement("div");
            item.className = "gallery-item";

            const img = document.createElement("img");
            img.src = `images/Activities/${year}/${activityName}/${coverPhoto}`;
            img.alt = activityName;
            img.addEventListener("click", () => renderPhotos(year, activityName));

            const title = document.createElement("h3");
            title.textContent = activityName.replace(/^(\d{4}\.\d{2}\.\d{2})/, "$1 ");

            item.appendChild(img);
            item.appendChild(title);
            gallery.appendChild(item);
        });

        albumRoot.appendChild(gallery);
    }

    // 顯示活動內所有照片
    function renderPhotos(year, activityName) {
        clearGallery();

        const gallery = document.createElement("div");
        gallery.className = "gallery";

        albumData[year][activityName].forEach(photo => {
            const item = document.createElement("div");
            item.className = "gallery-item";

            const img = document.createElement("img");
            img.src = `images/Activities/${year}/${activityName}/${photo}`;
            img.alt = activityName;

            img.addEventListener("click", () => {
                openLightbox(img.src, activityName, year, activityName);
            });

            item.appendChild(img);
            gallery.appendChild(item);
        });

        albumRoot.appendChild(gallery);

        const backBtn = document.createElement("button");
        backBtn.textContent = "← 上一頁";
        backBtn.className = "back-btn";
        backBtn.addEventListener("click", () => renderActivities(currentYear));
        albumRoot.appendChild(backBtn);
    }

    // 清空舊的 gallery（保留年份按鈕列）
    function clearGallery() {
        albumRoot.querySelectorAll(".gallery, .back-btn").forEach(el => el.remove());
    }

    // ===== Lightbox 功能 =====
    function openLightbox(src, alt, year, activityName) {
        const overlay = document.createElement("div");
        overlay.className = "lightbox-overlay";

        const img = document.createElement("img");
        img.src = src;
        img.alt = alt;
        img.className = "lightbox-img";

        // 左右切換按鈕
        const prevBtn = document.createElement("button");
        prevBtn.className = "lightbox-prev";
        prevBtn.textContent = "‹";

        const nextBtn = document.createElement("button");
        nextBtn.className = "lightbox-next";
        nextBtn.textContent = "›";

        overlay.appendChild(prevBtn);
        overlay.appendChild(img);
        overlay.appendChild(nextBtn);
        document.body.appendChild(overlay);

        // 找到目前相片索引
        const photos = albumData[year][activityName];
        let currentIndex = photos.indexOf(src.split("/").pop());

        function showPhoto(index) {
            if (index < 0) index = photos.length - 1;
            if (index >= photos.length) index = 0;
            currentIndex = index;
            img.src = `images/Activities/${year}/${activityName}/${photos[currentIndex]}`;
        }

        prevBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showPhoto(currentIndex - 1);
        });
        nextBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showPhoto(currentIndex + 1);
        });

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // 鍵盤支援
        document.addEventListener("keydown", function keyHandler(e) {
            if (!document.body.contains(overlay)) {
                document.removeEventListener("keydown", keyHandler);
                return;
            }
            if (e.key === "ArrowLeft") showPhoto(currentIndex - 1);
            if (e.key === "ArrowRight") showPhoto(currentIndex + 1);
            if (e.key === "Escape") overlay.remove();
        });
    }
});