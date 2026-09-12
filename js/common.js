// 加载进度条逻辑已统一迁移至 /js/loading.js（真实进度），此处不再包含。

// ========== 通用内容初始化 ==========
// 可重复调用：既用于首次加载，也用于无刷新页面切换（SPA）后的内容重新绑定。
function initCommon() {
    const menuButton = document.querySelector('.menu');
    const nav = document.querySelector('nav ul');

    if (menuButton && nav && !menuButton.dataset.commonBound) {
        menuButton.dataset.commonBound = '1';
        menuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            nav.classList.toggle('show');
        });
    }

    // 点击菜单外区域关闭（整个文档只绑定一次）
    if (!window.__commonNavDocBound) {
        window.__commonNavDocBound = true;
        document.addEventListener('click', function(e) {
            if (!e.target.closest('header')) {
                const navList = document.querySelector('nav ul');
                if (navList) navList.classList.remove('show');
            }
        });
    }

    const announcement = document.querySelector('.Ad');
    const closeButton = document.querySelector('.Ad__close');

    if (announcement && closeButton && !closeButton.dataset.commonBound) {
        closeButton.dataset.commonBound = '1';
        closeButton.addEventListener('click', function() {
            announcement.classList.add('is-hidden');
            announcement.setAttribute('aria-hidden', 'true');
        });
    }

    initThemeToggle();

    // 评论区初始化（Giscus 自动加载）
    initCommentSection();
}

// 注册为可复用的页面模块（页面切换后重新初始化内容区）
window.__pageModules = window.__pageModules || {};
window.__pageModules['common.js'] = initCommon;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommon);
} else {
    initCommon();
}

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

    if (!themeButton.dataset.themeBound) {
        themeButton.dataset.themeBound = '1';
        themeButton.addEventListener('click', function() {
            const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
            saveTheme(nextTheme);
        });
    }
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

// ========== 无刷新页面切换（保留导航栏与 footer） ==========
// 统一在这里按需注入，全站所有引入 common.js 的页面都会自动获得该能力。
(function() {
    if (window.__pageTransitionLoading) return;
    if (document.querySelector('script[src*="page_transition.js"]')) return;
    window.__pageTransitionLoading = true;

    var script = document.createElement('script');
    script.src = '/js/page_transition.js';
    script.async = false;
    document.head.appendChild(script);
})();

