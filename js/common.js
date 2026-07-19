// ========================================
// 加载进度条 - 事件驱动重构版
// ========================================
(function() {
    'use strict';

    function initProgressBar() {
        const wrap = document.getElementById('gh-loader-wrap');
        const bar = document.getElementById('gh-loader');
        const tip = document.getElementById('gh-loader-tip');

        if (!wrap || !bar || !tip) return;

        let progress = 0;
        let targetProgress = 0;
        let animationFrame = null;
        let hideTimer = null;

        function showLoader() {
            wrap.classList.remove('hide');
            tip.classList.add('show');
        }

        function hideLoader() {
            wrap.classList.add('hide');
            tip.classList.remove('show');
        }

        function updateDisplay(value, text) {
            const pct = Math.min(100, Math.max(0, Math.round(value)));
            bar.style.width = pct + '%';
            tip.textContent = text || `加载中 ${pct}%`;

            if (pct >= 100) {
                hideLoader();
            } else {
                showLoader();
            }
        }

        function animateTo(target) {
            targetProgress = Math.min(100, Math.max(0, target));
            if (animationFrame) cancelAnimationFrame(animationFrame);

            function step() {
                const diff = targetProgress - progress;
                if (Math.abs(diff) < 0.5) {
                    progress = targetProgress;
                    updateDisplay(progress);

                    if (progress >= 100) {
                        if (hideTimer) clearTimeout(hideTimer);
                        hideTimer = setTimeout(hideLoader, 400);
                    }
                    return;
                }

                progress += diff * 0.2;
                updateDisplay(progress);
                animationFrame = requestAnimationFrame(step);
            }

            step();
        }

        function resetProgress() {
            progress = 0;
            targetProgress = 0;
            bar.style.width = '0%';
            hideLoader();
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
        }

        function updateByState() {
            const state = document.readyState;
            if (state === 'loading') {
                animateTo(20);
            } else if (state === 'interactive') {
                animateTo(60);
            } else if (state === 'complete') {
                animateTo(90);
            }
        }

        document.addEventListener('readystatechange', updateByState);

        window.addEventListener('load', function() {
            animateTo(100);
        });

        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
                resetProgress();
                animateTo(100);
            }
        });

        updateByState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProgressBar, { once: true });
    } else {
        initProgressBar();
    }
})();

// ========== 移动端菜单 ==========
document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.querySelector('.menu');
    const nav = document.querySelector('nav ul');

    if (menuButton && nav) {
        menuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            nav.classList.toggle('show');
        });

        // 点击菜单外区域关闭
        document.addEventListener('click', function(e) {
            if (!e.target.closest('header')) {
                nav.classList.remove('show');
            }
        });
    }

    const announcement = document.querySelector('.Ad');
    const closeButton = document.querySelector('.Ad__close');

    if (announcement && closeButton) {
        closeButton.addEventListener('click', function() {
            announcement.classList.add('is-hidden');
            announcement.setAttribute('aria-hidden', 'true');
        });
    }

    initThemeToggle();

    // 页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.4s';
        document.body.style.opacity = '1';
    }, 100);

    // 评论区初始化（Giscus 自动加载）
    initCommentSection();
});

// ========== 评论占位函数 ==========
function initCommentSection() {
    // Giscus 会自动加载，无需额外操作
}

// ========== 主题切换 ==========
function getSavedTheme() {
    try {
        return localStorage.getItem('site-theme');
    } catch (err) {
        return null;
    }
}

function saveTheme(value) {
    try {
        localStorage.setItem('site-theme', value);
    } catch (err) {
        // Ignore storage errors
    }
}

function getDefaultTheme() {
    const saved = getSavedTheme();
    if (saved === 'dark' || saved === 'light') {
        return saved;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
        const isDark = theme === 'dark';
        toggle.textContent = isDark ? '🌙' : '☀️';
        toggle.setAttribute('aria-pressed', String(isDark));
        toggle.title = isDark ? '切换到白天模式' : '切换到暗黑模式';
    }

    // Swap images that provide a dark-mode source via data-dark-src
    try {
        document.querySelectorAll('img[data-dark-src]').forEach(img => {
            const darkSrc = img.getAttribute('data-dark-src');
            const lightSrc = img.getAttribute('data-light-src') || img.getAttribute('src') || '';
            // ensure data-light-src is set so we can revert
            if (!img.getAttribute('data-light-src')) img.setAttribute('data-light-src', lightSrc);
            img.src = theme === 'dark' ? darkSrc : img.getAttribute('data-light-src');
        });
    } catch (e) {
        // ignore
    }
}

function initThemeToggle() {
    const navList = document.querySelector('header nav ul');
    if (!navList) {
        applyTheme(getDefaultTheme());
        return;
    }

    let themeButton = document.querySelector('.theme-toggle');
    if (!themeButton) {
        const listItem = document.createElement('li');
        listItem.className = 'theme-toggle-item';
        themeButton = document.createElement('button');
        themeButton.type = 'button';
        themeButton.className = 'theme-toggle';
        themeButton.setAttribute('aria-label', '切换网站主题');
        listItem.appendChild(themeButton);
        navList.appendChild(listItem);
    }

    const currentTheme = getDefaultTheme();
    applyTheme(currentTheme);

    themeButton.addEventListener('click', function() {
        const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        saveTheme(nextTheme);
    });
}

// ========== 置顶按钮（统一创建 + 事件绑定） ==========
(function() {
    'use strict';

    function isHtmlDocument() {
        return !!(document.documentElement && document.documentElement.nodeName === 'HTML');
    }

    function ensureBackToTopStyles() {
        if (document.getElementById('back-to-top-style')) return;

        const style = document.createElement('style');
        style.id = 'back-to-top-style';
        style.textContent = `
            #back-to-top {
                position: fixed !important;
                right: 24px !important;
                bottom: 88px !important;
                z-index: 2147483647 !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 56px !important;
                height: 56px !important;
                padding: 0 !important;
                border: none !important;
                border-radius: 999px !important;
                background: linear-gradient(135deg, #0f9d58 0%, #0b7a44 100%) !important;
                color: #ffffff !important;
                box-shadow: 0 12px 24px rgba(15, 157, 88, 0.22) !important;
                cursor: pointer !important;
                opacity: 0 !important;
                pointer-events: none !important;
                transform: translateY(12px) scale(0.96) !important;
                transition: opacity 0.2s ease, transform 0.25s ease, width 0.25s ease, padding 0.25s ease, box-shadow 0.25s ease !important;
            }
            #back-to-top.show {
                opacity: 1 !important;
                pointer-events: auto !important;
                transform: translateY(0) scale(1) !important;
            }
            #back-to-top:hover,
            #back-to-top:focus-visible {
                width: 128px !important;
                padding: 0 14px !important;
                transform: translateX(-6px) translateY(0) scale(1) !important;
                box-shadow: 0 14px 28px rgba(15, 157, 88, 0.24) !important;
            }
            #back-to-top__icon {
                font-size: 1.2rem !important;
                font-weight: 700 !important;
                line-height: 1 !important;
            }
            #back-to-top__label {
                display: inline-block !important;
                width: 0 !important;
                margin-left: 0 !important;
                opacity: 0 !important;
                overflow: hidden !important;
                white-space: nowrap !important;
                font-size: 0.95rem !important;
                font-weight: 600 !important;
                transition: width 0.25s ease, opacity 0.25s ease, margin-left 0.25s ease !important;
            }
            #back-to-top:hover #back-to-top__label,
            #back-to-top:focus-visible #back-to-top__label {
                width: auto !important;
                margin-left: 0.45rem !important;
                opacity: 1 !important;
            }
        `;
        document.head.appendChild(style);
    }

    function initBackToTop() {
        if (!isHtmlDocument()) return;

        ensureBackToTopStyles();

        let btn = document.getElementById('back-to-top');
        if (btn && btn.parentNode !== document.body) {
            document.body.appendChild(btn);
        }
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'back-to-top';
            btn.type = 'button';
            btn.setAttribute('aria-label', '点击置顶');
            btn.title = '点击置顶';
            btn.innerHTML = '<span id="back-to-top__icon">↑</span><span id="back-to-top__label">点击置顶</span>';
            document.body.appendChild(btn);
        }

        function updateVisibility() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
            btn.classList.toggle('show', scrollTop > 200);
        }

        function scrollToTop(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }

        btn.removeEventListener('click', scrollToTop);
        btn.addEventListener('click', scrollToTop);

        window.addEventListener('scroll', updateVisibility, { passive: true });
        window.addEventListener('load', updateVisibility);
        window.addEventListener('resize', updateVisibility);
        updateVisibility();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBackToTop, { once: true });
    } else {
        initBackToTop();
    }
})();

// ========== 自动给所有外部链接添加安全跳转 ==========
(function() {
    'use strict';

    const JUMP_BASE = '/jump_warning.html?url=';

        function shouldProcess(href) {
        if (!href) return false;
        // ① 已经是跳转链接或者跳转页本身，直接跳过，防止死循环
        if (href.startsWith(JUMP_BASE)) return false;
        if (href.startsWith('/jump_warning.html')) return false;
        if (href.includes('/jump_warning.html')) return false;
        
        // ② 站内链接/特殊协议直接跳过
        if (href.startsWith('/') || href.startsWith('#') ||
            href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return false;
        }
        
        // ③ 仅处理外部 HTTP/HTTPS 链接
        return (href.startsWith('http://') || href.startsWith('https://'));
    }

    function processLink(link) {
        let href = link.getAttribute('href');
        if (!shouldProcess(href)) return;
        if (href.startsWith(JUMP_BASE)) return;
        const encoded = encodeURIComponent(href);
        link.setAttribute('href', JUMP_BASE + encoded);
        if (link.getAttribute('target') === '_blank') {
            link.removeAttribute('target');
        }
        link.setAttribute('rel', 'noopener noreferrer');
    }

    function processAllLinks() {
        const links = document.querySelectorAll('a[href]');
        links.forEach(processLink);
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches && node.matches('a[href]')) {
                            processLink(node);
                        }
                        if (node.querySelectorAll) {
                            node.querySelectorAll('a[href]').forEach(processLink);
                        }
                    }
                }
            }
        }
    });

    function startObserver() {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            processAllLinks();
            startObserver();
            window.addEventListener('load', processAllLinks);
        });
    } else {
        processAllLinks();
        startObserver();
    }
})();
