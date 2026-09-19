/* ============================================================
   page_transition.js — 站内无刷新页面切换（保留导航栏与 footer）
   ------------------------------------------------------------
   目标：在切换页面时，如果「当前页面」和「目标页面」都同时具备
        <header> 导航栏 与 <footer> 页脚，则：
          1. 不重新加载整份文档（导航栏、footer、主题、置顶按钮等
             全局状态全部保留）；
          2. 只替换 header 与 footer 之间的「内容区」；
          3. 同步目标页的 <head> 样式（差分增删，避免闪烁）；
          4. 按需加载目标页的页面级脚本（含文章页的评论脚本）并重新
             初始化内容，行内脚本的 DOMContentLoaded 回调也会被触发；
          5. 使用浏览器原生 View Transitions API 做过渡动画，
             不支持时回退为内容淡入动画。

   覆盖范围：所有「同时具备导航栏与 footer」的站内页面（含 articles/ 目录
   下的全部文章页）。对于缺少导航栏 / footer 的页面（如 /app、游戏/工具
   的独立子页、跳转中转页等），会自动退回普通整页跳转。

   本脚本由 /js/common.js 自动注入，全站只需维护一个文件。
   ============================================================ */
(function () {
    'use strict';

    if (window.__pageTransitionInit) return;
    window.__pageTransitionInit = true;

    // ---- 明确排除：不作为无刷新切换目标的页面（含中转/跳转页、无导航栏
    //      的独立工具页、体积过大的交互页等），避免破坏其自身逻辑 ----
    var EXCLUDE_PATHS = [
        '/contact.html',            // 联系方式中转（含 meta refresh 自动跳转）
        '/jump_warning.html',       // 外链安全警告中转页
        '/404.html',
        '/privacy', '/privacy.html',
        '/rules', '/rules.html',
        '/legacy_browser.html',
        '/toast.html',
        '/googleca0b1bbe0f5307c1.html',
        '/articles/5/game.html',    // 超大独立游戏页
        '/articles/6/app.html',     // 独立工具页
        '/articles/6/shuju.html'    // 独立数据页
    ];
    var EXCLUDE_PREFIXES = ['/app/'];

    // ---- 全站公共脚本：不作为「页面级模块」重复初始化 ----
    var CORE_SCRIPTS = [
        'legacy_redirect.js', 'dark_fix.js', 'loading.js', 'common.js',
        'jump_warning.js', 'nope.js', 'page_transition.js'
    ];

    // ---- 由全局脚本管理、切换内容区时必须保留的节点 id ----
    var KEEP_IDS = [
        'gh-loader-wrap', 'gh-loader', 'gh-loader-tip',
        'back-to-top', 'nope-popup-overlay',
        'image-zoom-overlay'        // 全站图片放大浮层
    ];

    // 管理脚本注入的 <style>，切换时不被误删
    var KEEP_STYLE_IDS = ['nope-popup-styles', 'back-to-top-style', 'pjax-style', 'image-zoom-style'];

    // 单页 HTML 体积上限：超过此值说明不是普通内容页（如内嵌大型交互页），
    // 直接放弃无刷新切换，避免下载巨大的文档。
    var MAX_HTML_BYTES = 2 * 1024 * 1024; // 2MB

    var CACHE = Object.create(null);          // url -> Document
    var loadedScripts = Object.create(null);  // src -> true
    var navigating = false;

    // ---------------------------------------------------------
    // 工具函数
    // ---------------------------------------------------------
    function isExcluded(pathname) {
        var p = pathname.replace(/\/index\.html$/, '/');
        if (EXCLUDE_PATHS.indexOf(pathname) !== -1) return true;
        if (EXCLUDE_PATHS.indexOf(p) !== -1) return true;
        for (var i = 0; i < EXCLUDE_PREFIXES.length; i++) {
            if (pathname.indexOf(EXCLUDE_PREFIXES[i]) === 0) return true;
        }
        return false;
    }

    // 判断是否为「可尝试无刷新切换」的站内 HTML 导航链接。
    // 注意：这里只做「是否属于 HTML 导航」的粗判，真正是否具备导航栏 /
    // footer 会在抓取目标文档后再次校验（getRegions），不具备则整页跳转。
    function isNavigable(url) {
        try {
            var u = (url instanceof URL) ? url : new URL(url, location.href);
            if (u.origin !== location.origin) return false;
            var p = u.pathname;
            if (isExcluded(p)) return false;
            if (p === '/' || p.charAt(p.length - 1) === '/') return true; // 目录
            if (/\.html?$/i.test(p)) return true;                          // .html / .htm
            if (!/\.[a-z0-9]+$/i.test(p)) return true;                     // 无扩展名（如 /privacy）
            return false;
        } catch (e) {
            return false;
        }
    }

    function prefersReducedMotion() {
        return !!(window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    function basename(src) {
        try {
            return new URL(src, location.href).pathname.split('/').pop();
        } catch (e) {
            return '';
        }
    }

    // 取出 body 中「header 与 footer 之间」的内容区节点
    function getRegions(doc) {
        var body = doc && doc.body;
        if (!body) return null;
        var header = body.querySelector(':scope > header');
        var footer = body.querySelector(':scope > footer');

        if (header && footer) {
            var content = [];
            var node = header.nextElementSibling;
            while (node && node !== footer) {
                content.push(node);
                node = node.nextElementSibling;
            }
            return { header: header, footer: footer, content: content };
        }

        // header / footer 由 common.js 动态注入的页面：抓取到的静态 HTML
        // 中没有这两个容器。若目标页引入了 common.js，则视其整个 <body>
        // 为内容区，布局复用当前页面已注入的 header / footer；
        // 否则（未引入 common.js 的独立子页）维持原行为：返回 null，
        // 退回整页跳转。
        if (doc === document) return null;
        var hasCommon = doc.querySelector('script[src*="common.js"]');
        if (!hasCommon) return null;
        var cur = getRegions(document);
        if (!cur) return null;

        var all = [];
        Array.prototype.forEach.call(body.children, function (n) {
            all.push(n);
        });
        return { header: cur.header, footer: cur.footer, content: all };
    }

    function shouldKeep(node) {
        if (!node || node.nodeType !== 1) return false;
        if (node.id && KEEP_IDS.indexOf(node.id) !== -1) return true;
        if (node.classList && node.classList.contains('nope-overlay')) return true;
        return false;
    }

    // ---------------------------------------------------------
    // 样式同步（差分，保证公共样式不闪烁）
    // ---------------------------------------------------------
    function hrefOf(el) {
        try {
            return new URL(el.getAttribute('href'), location.href).href;
        } catch (e) {
            return '';
        }
    }

    function syncHead(targetDoc) {
        var waits = [];

        // ① <link rel="stylesheet"> 差分
        var curLinks = Object.create(null);
        Array.prototype.forEach.call(
            document.querySelectorAll('link[rel="stylesheet"][href]'),
            function (el) { curLinks[hrefOf(el)] = el; }
        );
        var nextLinks = Object.create(null);
        Array.prototype.forEach.call(
            targetDoc.querySelectorAll('link[rel="stylesheet"][href]'),
            function (el) { nextLinks[hrefOf(el)] = el.getAttribute('href'); }
        );

        // 先加入目标页新增的样式表（避免出现「无样式」空档），再移除多余的
        Object.keys(nextLinks).forEach(function (href) {
            if (curLinks[href]) return;
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.setAttribute('data-pjax', 'style');
            document.head.appendChild(link);

            waits.push(new Promise(function (resolve) {
                var done = false;
                function fin() { if (!done) { done = true; resolve(); } }
                link.addEventListener('load', fin, { once: true });
                link.addEventListener('error', fin, { once: true });
                setTimeout(fin, 600);
            }));
        });
        Object.keys(curLinks).forEach(function (href) {
            if (!nextLinks[href]) {
                var el = curLinks[href];
                el.parentNode && el.parentNode.removeChild(el);
            }
        });

        // ② 行内 <style> 差分（如 about.html 的页面级样式）
        var curStyles = Object.create(null);
        Array.prototype.forEach.call(
            document.querySelectorAll('head style'),
            function (el) {
                if (el.id && KEEP_STYLE_IDS.indexOf(el.id) !== -1) return;
                curStyles[el.textContent] = el;
            }
        );
        var nextStyles = Object.create(null);
        Array.prototype.forEach.call(
            targetDoc.querySelectorAll('head style'),
            function (el) { nextStyles[el.textContent] = true; }
        );

        Object.keys(curStyles).forEach(function (key) {
            if (!(key in nextStyles)) {
                var el = curStyles[key];
                el.parentNode && el.parentNode.removeChild(el);
            }
        });
        Object.keys(nextStyles).forEach(function (key) {
            if (key in curStyles) return;
            if (!key.trim()) return;
            var style = document.createElement('style');
            style.setAttribute('data-pjax', 'style');
            style.textContent = key;
            document.head.appendChild(style);
        });

        return Promise.all(waits);
    }

    // ---------------------------------------------------------
    // 内容区替换
    // ---------------------------------------------------------
    function swapContent(targetDoc) {
        var cur = getRegions(document);
        var tgt = getRegions(targetDoc);
        if (!cur || !tgt) return false;

        var anchor = cur.footer;
        var parent = anchor.parentNode;

        // 移除当前内容区（保留全局管理节点）
        cur.content.forEach(function (node) {
            if (!shouldKeep(node) && node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });

        // 插入目标内容区（克隆；脚本节点单独处理）
        tgt.content.forEach(function (node) {
            if (shouldKeep(node)) return;
            if (node.tagName === 'SCRIPT') return;
            parent.insertBefore(document.importNode(node, true), anchor);
        });
        return true;
    }

    // ---------------------------------------------------------
    // 页面级脚本加载与初始化
    // ---------------------------------------------------------
    function collectPageScripts(doc) {
        var list = [];
        Array.prototype.forEach.call(doc.querySelectorAll('script[src]'), function (el) {
            var src = el.getAttribute('src');
            if (!src) return;
            var abs;
            try { abs = new URL(src, location.href); } catch (e) { return; }
            var base = basename(abs.href);
            if (CORE_SCRIPTS.indexOf(base) !== -1) return; // 公共脚本不重复加载
            list.push({ href: abs.href, base: base });
        });
        return list;
    }

    function loadScript(href) {
        if (loadedScripts[href]) return Promise.resolve();
        loadedScripts[href] = true;
        return new Promise(function (resolve) {
            var s = document.createElement('script');
            s.src = href;
            s.async = false;
            s.addEventListener('load', function () { resolve(); }, { once: true });
            s.addEventListener('error', function () { resolve(); }, { once: true });
            document.head.appendChild(s);
        });
    }

    // 执行目标页 body 中的行内脚本。
    // 关键点：行内脚本常用 document.addEventListener('DOMContentLoaded', fn)
    // 做初始化，但当前文档早已触发过该事件，回调不会自然执行。这里在执行期间
    // 临时接管 addEventListener，收集 DOMContentLoaded / load 回调并在脚本执行
    // 结束后立即手动触发，从而模拟「新页面刚刚加载完成」。
    function runInlineScripts(targetDoc) {
        if (!targetDoc.body) return;
        var scripts = targetDoc.body.querySelectorAll('script:not([src])');
        Array.prototype.forEach.call(scripts, function (old) {
            var pending = [];
            var docAdd = document.addEventListener;
            var winAdd = window.addEventListener;

            function wrap(orig, target) {
                return function (type, listener, opts) {
                    if ((type === 'DOMContentLoaded' || type === 'load') &&
                        typeof listener === 'function') {
                        pending.push(listener);
                        return;
                    }
                    return orig.call(target, type, listener, opts);
                };
            }

            document.addEventListener = wrap(docAdd, document);
            window.addEventListener = wrap(winAdd, window);

            var s = document.createElement('script');
            Array.prototype.forEach.call(old.attributes, function (attr) {
                s.setAttribute(attr.name, attr.value);
            });
            s.textContent = old.textContent;

            try {
                document.body.appendChild(s); // 行内脚本同步执行
            } catch (e) {
                // 单个脚本报错不影响其它脚本
            } finally {
                try { delete document.addEventListener; } catch (err) { document.addEventListener = docAdd; }
                try { delete window.addEventListener; } catch (err2) { window.addEventListener = winAdd; }
                s.parentNode && s.parentNode.removeChild(s);
            }

            pending.forEach(function (cb) {
                try { cb.call(document, new Event('DOMContentLoaded')); }
                catch (e) { /* 忽略初始化异常 */ }
            });
        });
    }

    function initPage(targetDoc) {
        // 公共内容初始化（导航栏按钮、公告关闭、主题图标等）
        var commonFn = window.__pageModules && window.__pageModules['common.js'];
        if (typeof commonFn === 'function') commonFn();

        var scripts = collectPageScripts(targetDoc);
        var needLoad = scripts.filter(function (it) { return !loadedScripts[it.href]; });

        // 动态加载期间，页面脚本跳过自初始化，交由下方统一调用
        window.__pjaxDynamicLoad = needLoad.length > 0;
        var loadAll = Promise.all(needLoad.map(function (it) { return loadScript(it.href); }));

        return loadAll.then(function () {
            window.__pjaxDynamicLoad = false;
            scripts.forEach(function (it) {
                var fn = window.__pageModules && window.__pageModules[it.base];
                if (typeof fn === 'function') fn();
            });
            runInlineScripts(targetDoc);
        });
    }

    // ---------------------------------------------------------
    // 滚动处理
    // ---------------------------------------------------------
    function handleScroll(url) {
        var hash = '';
        try { hash = new URL(url, location.href).hash; } catch (e) { hash = ''; }
        if (hash && hash.length > 1) {
            var el = document.getElementById(hash.slice(1));
            if (el) {
                el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
                return;
            }
        }
        window.scrollTo(0, 0);
    }

    // ---------------------------------------------------------
    // 应用变更（含过渡动画）
    // ---------------------------------------------------------
    function applyChanges(targetDoc) {
        // 内容替换（先做，保证新内容立即就位）
        swapContent(targetDoc);
        document.title = targetDoc.title || document.title;

        // 样式差分（等待新增样式加载完毕，避免内容无样式闪现）
        return syncHead(targetDoc).then(function () {
            return initPage(targetDoc);
        });
    }

    function commit(targetDoc, url, animated) {
        if (animated && typeof document.startViewTransition === 'function') {
            try {
                var transition = document.startViewTransition(function () {
                    return applyChanges(targetDoc);
                });
                return (transition.finished || Promise.resolve()).catch(function () {});
            } catch (e) {
                // 动画启动失败时退回下方的手动淡入
            }
        }

        // 回退：内容淡入
        return applyChanges(targetDoc).then(function () {
            var regions = getRegions(document);
            if (!regions) return;
            regions.content.forEach(function (node) {
                if (node.nodeType !== 1) return;
                node.classList.add('pjax-enter');
                node.addEventListener('animationend', function () {
                    node.classList.remove('pjax-enter');
                }, { once: true });
            });
        });
    }

    // ---------------------------------------------------------
    // 文档获取与导航
    // ---------------------------------------------------------
    function fetchDoc(url) {
        if (CACHE[url]) return Promise.resolve(CACHE[url]);
        return fetch(url, {
            credentials: 'same-origin',
            headers: { 'X-Requested-With': 'page-transition' }
        }).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            var ct = res.headers.get('content-type') || '';
            if (ct && ct.indexOf('text/html') === -1) throw new Error('not html');

            // 体积过大的文档直接放弃无刷新（不读取 body，节省流量）
            var len = parseInt(res.headers.get('content-length') || '0', 10);
            if (len && len > MAX_HTML_BYTES) {
                try { res.body && res.body.cancel && res.body.cancel(); } catch (e) {}
                throw new Error('too large');
            }
            return res.text();
        }).then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            CACHE[url] = doc;
            return doc;
        });
    }

    function navigate(url, opts) {
        opts = opts || {};
        if (navigating) return;
        navigating = true;

        fetchDoc(url).then(function (targetDoc) {
            // 两端都必须具备导航栏与 footer，否则退回整页跳转
            if (!getRegions(document) || !getRegions(targetDoc)) {
                location.href = url;
                return;
            }
            var animated = !opts.noAnim && !prefersReducedMotion();

            // 先更新地址栏，保证目标页行内脚本读取到的 location 正确
            if (!opts.pop) {
                history.pushState({ pjax: true, url: url }, '', url);
            }
            window.__pjaxHasNavigated = true;

            return commit(targetDoc, url, animated).then(function () {
                handleScroll(url);
            });
        }).catch(function () {
            // 任何异常都安全降级为普通跳转
            location.href = url;
        }).then(function () {
            navigating = false;
        });
    }

    // ---------------------------------------------------------
    // 链接拦截
    // ---------------------------------------------------------
    function onClick(e) {
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var a = e.target.closest && e.target.closest('a[href]');
        if (!a) return;
        if (a.hasAttribute('download')) return;
        if (a.hasAttribute('data-no-pjax')) return;
        if (a.target && a.target !== '_self') return;

        var href = a.getAttribute('href');
        if (!href) return;
        if (/^(javascript|mailto|tel|blob|data):/i.test(href)) return;
        if (href.charAt(0) === '#') return; // 页内锚点交给浏览器

        var url;
        try { url = new URL(a.href, location.href); } catch (err) { return; }
        if (!isNavigable(url)) return; // 非站内 HTML 导航，走普通跳转

        // 同一页面仅 hash 变化，交给浏览器
        if (url.pathname === location.pathname && url.search === location.search) return;

        e.preventDefault();
        navigate(url.href);
    }

    // 处理使用内联 onclick="window.location.href='...'" 的按钮（如文章页
    // 底部的「浏览更多文章 / 返回首页」）。捕获阶段先于内联 onclick 执行，
    // 拦截后改走无刷新切换，并阻止内联脚本再次触发整页跳转。
    function onCaptureClick(e) {
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var el = e.target.closest && e.target.closest('[onclick]');
        if (!el || el.tagName === 'A') return;

        var code = el.getAttribute('onclick') || '';
        var m = code.match(/window\.location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/);
        if (!m) return;

        var url;
        try { url = new URL(m[1], location.href); } catch (err) { return; }
        if (!isNavigable(url)) return; // 站外或不可切换的目标，保持原行为

        e.preventDefault();
        e.stopPropagation();
        navigate(url.href);
    }

    function onPopState() {
        if (!isNavigable(location.href)) {
            // 返回目标是不可无刷新切换的页面。若当前文档已被无刷新切换改写，
            // 同文档回退不会自动恢复原页面，需强制重新加载。
            if (window.__pjaxHasNavigated) {
                window.__pjaxHasNavigated = false;
                location.reload();
            }
            return;
        }
        navigate(location.href, { pop: true });
    }

    // ---------------------------------------------------------
    // 过渡样式
    // ---------------------------------------------------------
    function injectStyles() {
        if (document.getElementById('pjax-style')) return;
        var style = document.createElement('style');
        style.id = 'pjax-style';
        style.textContent = [
            /* 导航栏与 footer 固定不参与过渡动画 */
            'header { view-transition-name: site-header; }',
            'footer { view-transition-name: site-footer; }',
            /* 常驻的浮动元素也固定，避免跟随内容一起位移 */
            '#back-to-top { view-transition-name: back-to-top; }',
            '#gh-loader-wrap { view-transition-name: pjax-loadbar; }',
            '#gh-loader-tip { view-transition-name: pjax-loadtip; }',
            '::view-transition-old(root), ::view-transition-new(root) {',
            '    animation-duration: .34s;',
            '    animation-timing-function: cubic-bezier(.2, .7, .2, 1);',
            '}',
            '::view-transition-old(root) { animation-name: pjax-fade-out; }',
            '::view-transition-new(root) { animation-name: pjax-slide-in; }',
            '@keyframes pjax-slide-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }',
            '@keyframes pjax-fade-out { from { opacity: 1; } to { opacity: 0; } }',
            /* 不支持 View Transitions 时的回退动画 */
            '.pjax-enter { animation: pjax-slide-in .34s cubic-bezier(.2, .7, .2, 1); }'
        ].join('\n');
        document.head.appendChild(style);
    }

    // ---------------------------------------------------------
    // 启动
    // ---------------------------------------------------------
    function boot() {
        injectStyles();
        document.addEventListener('click', onCaptureClick, true); // 捕获阶段
        document.addEventListener('click', onClick, false);      // 冒泡阶段
        window.addEventListener('popstate', onPopState);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
