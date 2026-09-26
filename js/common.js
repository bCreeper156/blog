// 加载进度条逻辑已统一迁移至 /js/loading.js（真实进度），此处不再包含。

// ========== 通用内容初始化 ==========
// 可重复调用：既用于首次加载，也用于无刷新页面切换（SPA）后的内容重新绑定。
function initCommon() {
    // 先确保 header / footer 已由 JS 注入，再绑定其中的交互
    initNavFooter();

    if (!window.__commonMenuBound) {
        window.__commonMenuBound = true;
        document.addEventListener('click', function(e) {
            const menuButton = e.target.closest('.menu');
            if (!menuButton) return;

            const nav = document.querySelector('header nav ul');
            if (!nav) return;

            e.stopPropagation();
            const isOpen = nav.classList.toggle('show');
            menuButton.setAttribute('aria-expanded', String(isOpen));
        });
    }

    // 点击菜单外区域关闭（整个文档只绑定一次）
    if (!window.__commonNavDocBound) {
        window.__commonNavDocBound = true;
        document.addEventListener('click', function(e) {
            if (e.target.closest('.menu')) return;
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

    // 全站图片放大（Lightbox）—— 模块定义在下方，首次加载由其自行初始化，
    // 这里仅用于无刷新切换（SPA）后重新确认已绑定（幂等）。
    if (typeof window.initImageZoom === 'function') {
        window.initImageZoom();
    }

    // 评论区初始化（Giscus 自动加载）
    initCommentSection();
}

// ========== 导航栏与版权声明（JS 驱动） ==========
// 整个 header（含导航栏）与 footer（版权声明）均由 JS 创建。
// 各页面 HTML 在原 header / footer 位置放置占位 div：
//   <div id="site-header"></div> 与 <div id="site-footer"></div>
// initNavFooter() 会把构建好的 <header> / <footer> 原地替换进占位 div，
// 从而保持原有的文档结构与样式作用位置；页面缺少占位 div 时退回
// body 开头 / 末尾插入。幂等：已存在则跳过。

const SITE_NAV_ITEMS = [
    { href: '/index.html', label: '首页' },
    { href: '/blog.html', label: '博客' },
    { href: '/link.html', label: '链接' },
    { href: '/about.html', label: '关于' }
];

const SITE_FOOTER_LINKS = [
    { href: '/jump_warning.html?url=https://github.com/bCreeper156/blog/blob/main/LICENSE', label: 'Copyright © ' + new Date().getFullYear() + ' Creeper156' },
    { href: '/privacy', label: '隐私政策' },
    { href: '/rules', label: '用户与评论政策' }
];

function buildSiteHeader() {
    const header = document.createElement('header');

    const menuBtn = document.createElement('button');
    menuBtn.className = 'menu';
    menuBtn.innerHTML = '<span class="material-symbols-rounded">menu</span>';
    header.appendChild(menuBtn);

    const h1 = document.createElement('h1');
    const siteLink = document.createElement('a');
    siteLink.href = '/';
    siteLink.textContent = '156博客';
    h1.appendChild(siteLink);
    header.appendChild(h1);

    const nav = document.createElement('nav');
    const ul = document.createElement('ul');
    SITE_NAV_ITEMS.forEach(function (item) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.label;
        li.appendChild(a);
        ul.appendChild(li);
    });
    nav.appendChild(ul);
    header.appendChild(nav);

    return header;
}

function buildSiteFooter() {
    const footer = document.createElement('footer');
    const p = document.createElement('p');
    SITE_FOOTER_LINKS.forEach(function (item, i) {
        if (i > 0) p.appendChild(document.createTextNode(' · '));
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.label;
        p.appendChild(a);
    });
    footer.appendChild(p);
    return footer;
}

function initNavFooter() {
    if (!document.body) return;

    // header：优先替换页面中的占位 div（#site-header）
    if (!document.querySelector('body > header')) {
        const headerHost = document.getElementById('site-header');
        if (headerHost && headerHost.parentNode === document.body) {
            document.body.replaceChild(buildSiteHeader(), headerHost);
        } else {
            document.body.insertBefore(buildSiteHeader(), document.body.firstChild);
        }
    }

    // footer：优先替换页面中的占位 div（#site-footer）
    if (!document.querySelector('body > footer')) {
        const footerHost = document.getElementById('site-footer');
        if (footerHost && footerHost.parentNode === document.body) {
            document.body.replaceChild(buildSiteFooter(), footerHost);
        } else {
            document.body.appendChild(buildSiteFooter());
        }
    }
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

// ========== 全站图片放大（Lightbox） ==========
// 说明：
//   1. 全站自动生效：点击正文（<main>）内的任意图片即可放大查看；
//   2. 采用「捕获阶段事件委托」绑定在 document 上，只绑定一次，
//      因此在无刷新页面切换（page_transition.js）替换内容区后依然有效，
//      无需在每次切换后重新绑定；
//   3. 支持：点击遮罩 / ✕ 按钮 / Esc 关闭；点击图片或双击切换缩放；
//      滚轮缩放（以光标为中心）；放大后拖动平移；
//   4. 如需让某张图片不参与放大，给该 <img> 添加 data-no-zoom 属性即可。
(function () {
    'use strict';

    var STYLE_ID = 'image-zoom-style';
    var OVERLAY_ID = 'image-zoom-overlay';
    var IMG_ID = 'image-zoom-img';
    var LOCK_CLASS = 'image-zoom-lock'; // 挂到 <html> 上，用于压制其它浮动元素
    var MIN_SCALE = 1;
    var MAX_SCALE = 6;
    var STEP = 1.25;

    var overlay = null;
    var zoomImg = null;
    var levelLabel = null;
    var scale = 1;
    var tx = 0;
    var ty = 0;
    var prevOverflow = '';
    var dragging = false;
    var dragStart = null;

    function ensureImageZoomStyles() {
        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            /* 正文图片默认可点击放大 */
            'main img:not([data-no-zoom]) { cursor: zoom-in; }',
            /* 放大浮层：最高层级，压过置顶按钮、加载进度条、弹窗等所有浮动元素 */
            '#' + OVERLAY_ID + ' {',
            '    position: fixed; inset: 0; z-index: 2147483647;',
            '    display: flex; align-items: center; justify-content: center;',
            '    background: rgba(8, 12, 10, 0);',
            '    opacity: 0; visibility: hidden; pointer-events: none;',
            '    overflow: hidden; touch-action: none;',
            '    transition: opacity .28s ease, background-color .28s ease, visibility .28s;',
            '}',
            /* 预览打开期间，压住其它常驻浮动元素，确保预览始终在最上层 */
            'html.' + LOCK_CLASS + ' #back-to-top,',
            'html.' + LOCK_CLASS + ' #gh-loader-wrap,',
            'html.' + LOCK_CLASS + ' #gh-loader-tip,',
            '#' + OVERLAY_ID + '.is-open {',
            '    opacity: 1; visibility: visible; pointer-events: auto;',
            '    background: rgba(8, 12, 10, .88);',
            '    -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);',
            '    transition: opacity .28s ease, background-color .28s ease, visibility 0s;',
            '}',
            '#' + IMG_ID + ' {',
            '    max-width: 92vw; max-height: 88vh; width: auto; height: auto;',
            '    border-radius: 12px; box-shadow: 0 24px 64px rgba(0, 0, 0, .5);',
            '    cursor: zoom-in; user-select: none; -webkit-user-drag: none;',
            '    transform: translate(0, 0) scale(1); transform-origin: center center;',
            '    transition: transform .18s ease, opacity .2s ease; will-change: transform;',
            '}',
            '#' + OVERLAY_ID + '.is-zoomed #' + IMG_ID + ' { cursor: grab; }',
            '#' + OVERLAY_ID + '.is-dragging #' + IMG_ID + ' { cursor: grabbing; transition: none; }',
            /* 关闭按钮 */
            '#image-zoom-close {',
            '    position: fixed; top: 18px; right: 20px; z-index: 2;',
            '    width: 44px; height: 44px; padding: 0; border: none; border-radius: 999px;',
            '    background: rgba(20, 24, 22, .72); color: #fff; font-size: 20px; line-height: 1;',
            '    cursor: pointer; transition: background-color .2s ease, transform .2s ease;',
            '    -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);',
            '}',
            '#image-zoom-close:hover { background: #0f9d58; transform: rotate(90deg); }',
            /* 底部工具栏 */
            '#image-zoom-toolbar {',
            '    position: fixed; left: 50%; bottom: 22px; z-index: 2;',
            '    display: flex; align-items: center; gap: 6px; padding: 8px 10px;',
            '    border-radius: 999px; background: rgba(20, 24, 22, .72);',
            '    box-shadow: 0 10px 30px rgba(0, 0, 0, .4);',
            '    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);',
            '    transform: translateX(-50%) translateY(12px); opacity: 0;',
            '    transition: opacity .25s ease, transform .25s ease;',
            '}',
            '#' + OVERLAY_ID + '.is-open #image-zoom-toolbar { opacity: 1; transform: translateX(-50%) translateY(0); }',
            '#image-zoom-toolbar button {',
            '    width: 38px; height: 38px; padding: 0; border: none; border-radius: 999px;',
            '    background: rgba(255, 255, 255, .1); color: #fff; font-size: 17px; line-height: 1;',
            '    cursor: pointer; transition: background-color .2s ease;',
            '}',
            '#image-zoom-toolbar button:hover { background: #0f9d58; }',
            '#image-zoom-level {',
            '    min-width: 52px; text-align: center; color: #fff; font-size: 13px;',
            '    font-weight: 600; font-variant-numeric: tabular-nums;',
            '}',
            '@media screen and (max-width: 768px) {',
            '    #' + IMG_ID + ' { max-width: 96vw; max-height: 82vh; }',
            '    #image-zoom-toolbar { gap: 4px; padding: 6px 8px; bottom: 14px; }',
            '    #image-zoom-toolbar button { width: 34px; height: 34px; font-size: 15px; }',
            '}',
            '@media (prefers-reduced-motion: reduce) {',
            '    #' + OVERLAY_ID + ', #' + IMG_ID + ', #image-zoom-toolbar { transition: none !important; }',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    function buildOverlay() {
        overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', '图片预览');
        overlay.innerHTML = [
            '<img id="' + IMG_ID + '" alt="">',
            '<button id="image-zoom-close" type="button" aria-label="关闭">&times;</button>',
            '<div id="image-zoom-toolbar">',
            '    <button type="button" data-act="out" aria-label="缩小">&minus;</button>',
            '    <span id="image-zoom-level">100%</span>',
            '    <button type="button" data-act="in" aria-label="放大">&plus;</button>',
            '    <button type="button" data-act="reset" aria-label="重置">&#8635;</button>',
            '</div>'
        ].join('');

        document.body.appendChild(overlay);

        zoomImg = overlay.querySelector('#' + IMG_ID);
        levelLabel = overlay.querySelector('#image-zoom-level');

        overlay.addEventListener('click', onOverlayClick);
        overlay.addEventListener('wheel', onWheel, { passive: false });
        zoomImg.addEventListener('pointerdown', onPointerDown);
        zoomImg.addEventListener('pointermove', onPointerMove);
        zoomImg.addEventListener('pointerup', onPointerUp);
        zoomImg.addEventListener('pointercancel', onPointerUp);
    }

    function applyTransform() {
        if (!zoomImg) return;
        zoomImg.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scale + ')';
        overlay.classList.toggle('is-zoomed', scale > 1.001);
        if (levelLabel) levelLabel.textContent = Math.round(scale * 100) + '%';
    }

    function clampScale(value) {
        return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
    }

    function resetView() {
        scale = 1;
        tx = 0;
        ty = 0;
        applyTransform();
    }

    function open(img) {
        var src = img.currentSrc || img.getAttribute('src');
        if (!src) return;

        ensureImageZoomStyles();
        if (!overlay) buildOverlay();

        zoomImg.style.opacity = '0';
        zoomImg.src = src;
        zoomImg.alt = img.getAttribute('alt') || '';
        resetView();

        if (!prevOverflow) prevOverflow = document.body.style.overflow || '';
        document.body.style.overflow = 'hidden';
        document.documentElement.classList.add(LOCK_CLASS);
        overlay.classList.add('is-open');

        var reveal = function () { zoomImg.style.opacity = '1'; };
        if (zoomImg.complete) {
            requestAnimationFrame(reveal);
        } else {
            zoomImg.addEventListener('load', reveal, { once: true });
            zoomImg.addEventListener('error', reveal, { once: true });
        }
    }

    function close() {
        if (!overlay || !overlay.classList.contains('is-open')) return;
        overlay.classList.remove('is-open', 'is-zoomed', 'is-dragging');
        document.documentElement.classList.remove(LOCK_CLASS);
        document.body.style.overflow = prevOverflow;
        prevOverflow = '';
        dragging = false;
    }

    function zoomTo(newScale, originX, originY) {
        newScale = clampScale(newScale);
        if (Math.abs(newScale - scale) < 0.0001) return;

        var rect = zoomImg.getBoundingClientRect();
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;
        var px = (originX == null) ? centerX : originX;
        var py = (originY == null) ? centerY : originY;

        var k = newScale / scale;
        tx += (px - centerX) * (1 - k);
        ty += (py - centerY) * (1 - k);
        scale = newScale;

        if (scale <= 1.001) { tx = 0; ty = 0; }
        applyTransform();
    }

    function onOverlayClick(e) {
        var act = e.target.closest ? e.target.closest('[data-act]') : null;
        if (act) {
            var type = act.getAttribute('data-act');
            if (type === 'in') zoomTo(scale * STEP);
            else if (type === 'out') zoomTo(scale / STEP);
            else resetView();
            return;
        }
        if (e.target === document.getElementById('image-zoom-close')) {
            close();
            return;
        }
        if (e.target === zoomImg) {
            // 点击图片：在 1x 与 2x 之间切换
            if (scale > 1.001) resetView();
            else zoomTo(2);
            return;
        }
        // 点击遮罩空白处关闭
        close();
    }

    function onWheel(e) {
        e.preventDefault();
        var factor = e.deltaY < 0 ? STEP : 1 / STEP;
        zoomTo(scale * factor, e.clientX, e.clientY);
    }

    function onPointerDown(e) {
        if (scale <= 1.001) return;
        dragging = true;
        dragStart = { x: e.clientX - tx, y: e.clientY - ty };
        overlay.classList.add('is-dragging');
        if (zoomImg.setPointerCapture) zoomImg.setPointerCapture(e.pointerId);
        e.preventDefault();
    }

    function onPointerMove(e) {
        if (!dragging) return;
        tx = e.clientX - dragStart.x;
        ty = e.clientY - dragStart.y;
        applyTransform();
    }

    function onPointerUp(e) {
        if (!dragging) return;
        dragging = false;
        overlay.classList.remove('is-dragging');
        if (zoomImg.releasePointerCapture) {
            try { zoomImg.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
    }

    function onKeydown(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (overlay && overlay.classList.contains('is-open')) {
                e.preventDefault();
                close();
            }
            return;
        }
        if (!overlay || !overlay.classList.contains('is-open')) return;
        if (e.key === '+' || e.key === '=') zoomTo(scale * STEP);
        else if (e.key === '-' || e.key === '_') zoomTo(scale / STEP);
        else if (e.key === '0') resetView();
    }

    // 捕获阶段监听：优先于站内无刷新跳转（page_transition.js）的链接拦截，
    // 避免正文中「被链接包裹的图片」在放大时误触发页面跳转。
    function onDocClickCapture(e) {
        if (e.button !== 0) return;
        var img = e.target;
        if (!img || img.tagName !== 'IMG') return;
        if (img.id === IMG_ID) return;
        if (img.hasAttribute('data-no-zoom')) return;
        if (!img.closest || !img.closest('main')) return; // 仅正文区域图片

        e.preventDefault();
        e.stopPropagation();
        open(img);
    }

    function initImageZoom() {
        if (!document.body) return;
        ensureImageZoomStyles();
        if (window.__imageZoomBound) return;
        window.__imageZoomBound = true;
        document.addEventListener('click', onDocClickCapture, true);
        document.addEventListener('keydown', onKeydown, false);
    }

    // 供 SPA 切换后调用（common.js 中的 initCommon 会调用）
    window.initImageZoom = initImageZoom;

    // 首次加载时自行初始化（事件委托 + 幂等，SPA 切换后无需重复绑定）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageZoom, { once: true });
    } else {
        initImageZoom();
    }
})();


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
    document.querySelectorAll('.theme-toggle').forEach(toggle => {
        const isDark = theme === 'dark';
        toggle.innerHTML = `<span class="material-symbols-rounded">${isDark ? 'dark_mode' : 'light_mode'}</span>`;
        toggle.setAttribute('aria-pressed', String(isDark));
        toggle.title = isDark ? '切换到白天模式' : '切换到暗黑模式';
    });

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

// 暴露主题接口，供独立页面（如 link.html?type=friends 友链模式）调用
window.__themeAPI = { applyTheme: applyTheme, getDefaultTheme: getDefaultTheme, saveTheme: saveTheme };

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

