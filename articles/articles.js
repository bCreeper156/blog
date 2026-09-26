// 为每一个文章页面结尾添加版权声明
(function() {
    'use strict';

    // 要插入的 HTML 内容
    var licenseHTML = '本文章被 <a href="https://raw.githubusercontent.com/bCreeper156/blog/refs/heads/main/LICENSE" target="_blank" rel="noopener noreferrer">CC BY-NC-ND 4.0</a> 所保护！<br />如需对本文章做任何操作，请遵循该许可证的所有条款，避免侵权带来的不必要的麻烦！';

    // 填充页面上所有 id 为 "LICENSE" 的元素（可重复执行）
    function fillLicense() {
        var elements = document.querySelectorAll('#LICENSE');
        for (var i = 0; i < elements.length; i++) {
            elements[i].innerHTML = licenseHTML;
        }
    }

    /* ============================================================
       文章目录（TOC）
       自动扫描正文中的 h2 ~ h4，生成可点击跳转的目录。
       仅改写结构（为标题补 id、渲染目录），不改动文章内容。
       ============================================================ */
    var TOC_MAX_LEVEL = 4;

    // 取得标题的纯文本（剔除图标字体等装饰元素）
    function getHeadingText(el) {
        var clone = el.cloneNode(true);
        var removable = clone.querySelectorAll('.material-symbols-rounded, .material-icons, img, svg');
        for (var i = 0; i < removable.length; i++) {
            if (removable[i].parentNode) {
                removable[i].parentNode.removeChild(removable[i]);
            }
        }
        return clone.textContent.replace(/\s+/g, ' ').trim();
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // 滚动时高亮当前所处章节
    function updateTocActive() {
        var links = document.querySelectorAll('#article-toc .article-toc-link');
        if (!links.length) return;
        var offset = 120;
        var activeHref = links[0].getAttribute('href');
        for (var i = 0; i < links.length; i++) {
            var target = document.getElementById(links[i].getAttribute('href').slice(1));
            if (target && target.getBoundingClientRect().top - offset <= 0) {
                activeHref = links[i].getAttribute('href');
            }
        }
        for (var j = 0; j < links.length; j++) {
            links[j].classList.toggle('active', links[j].getAttribute('href') === activeHref);
        }
    }

    function bindTocScrollListener() {
        if (window.__articleTocScrollBound) return;
        window.__articleTocScrollBound = true;
        window.addEventListener('scroll', updateTocActive, { passive: true });
        window.addEventListener('resize', updateTocActive);
    }

    function buildArticleToc() {
        var toc = document.getElementById('article-toc');
        var list = toc ? toc.querySelector('.article-toc-list') : null;
        if (!toc || !list) return;

        var content = document.querySelector('.article-content');
        if (!content) { toc.hidden = true; return; }

        // 仅采集正文标题，排除特色卡片、评论区等组件内的标题
        var candidates = content.querySelectorAll('h2, h3, h4, h5');
        var headings = [];
        for (var i = 0; i < candidates.length; i++) {
            var el = candidates[i];
            if (el.closest('.feature-card, .comment-widget, .cf-comment-widget, .article-actions, #article-toc')) continue;
            if (parseInt(el.tagName.substring(1), 10) > TOC_MAX_LEVEL) continue;
            headings.push(el);
        }

        if (headings.length < 2) {
            toc.hidden = true;
            list.innerHTML = '';
            return;
        }

        var html = '';
        for (var n = 0; n < headings.length; n++) {
            var heading = headings[n];
            var text = getHeadingText(heading) || ('第 ' + (n + 1) + ' 节');

            var id = heading.id;
            if (!id) {
                id = 'toc-' + (n + 1);
                var suffix = 1;
                while (document.getElementById(id)) {
                    id = 'toc-' + (n + 1) + '-' + (suffix++);
                }
                heading.id = id;
            }

            var level = parseInt(heading.tagName.substring(1), 10);
            html += '<li class="article-toc-item level-' + level + '">'
                 + '<a class="article-toc-link" href="#' + id + '">' + escapeHtml(text) + '</a>'
                 + '</li>';
        }

        list.innerHTML = html;
        toc.hidden = false;

        // 点击目录：平滑滚动到对应标题
        if (!list.dataset.tocBound) {
            list.dataset.tocBound = '1';
            list.addEventListener('click', function (event) {
                var link = event.target.closest ? event.target.closest('.article-toc-link') : null;
                if (!link) return;
                var target = document.getElementById(link.getAttribute('href').slice(1));
                if (!target) return;
                event.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (window.history && history.replaceState) {
                    history.replaceState(null, '', link.getAttribute('href'));
                }
                updateTocActive();
                closeMobileToc();
            });
        }

        bindTocScrollListener();
        updateTocActive();
    }

    // 根据目录是否显示，标记文章容器（无目录时宽屏下正文容器保持整体居中）
    function markArticleTocState(hasToc) {
        var article = document.querySelector('main article');
        if (article) {
            article.classList.toggle('no-toc', !hasToc);
        }
    }

    /* ============================================================
       代码块一键复制
       为 .article-content 内的每个 <pre> 包裹一层定位容器，
       按钮挂在容器上，避免 pre 的横向滚动带走按钮。
       ============================================================ */
    var COPY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>';
    var COPIED_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';

    function writeToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        // 兼容非 HTTPS / 旧内核环境：回退到 execCommand
        return new Promise(function (resolve, reject) {
            var area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.top = '-1000px';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            area.setSelectionRange(0, area.value.length);
            var ok = false;
            try {
                ok = document.execCommand('copy');
            } catch (err) {
                ok = false;
            }
            document.body.removeChild(area);
            ok ? resolve() : reject(new Error('copy failed'));
        });
    }

    function setCopyBtnState(button, copied) {
        button.classList.toggle('copied', copied);
        button.innerHTML = (copied ? COPIED_ICON : COPY_ICON)
            + '<span class="code-copy-text">' + (copied ? '已复制！' : '复制') + '</span>';
    }

    function initCodeCopy() {
        var blocks = document.querySelectorAll('.article-content pre');
        for (var i = 0; i < blocks.length; i++) {
            var pre = blocks[i];
            if (pre.dataset.copyReady) continue;
            pre.dataset.copyReady = '1';

            var wrapper = document.createElement('div');
            wrapper.className = 'code-block';

            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'code-copy-btn';
            button.setAttribute('aria-label', '复制代码');
            setCopyBtnState(button, false);

            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);
            wrapper.appendChild(button);

            button.addEventListener('click', (function (btn, source) {
                return function () {
                    var text = source ? source.textContent.replace(/\s+$/, '') : '';
                    writeToClipboard(text).then(function () {
                        setCopyBtnState(btn, true);
                        clearTimeout(btn.__copyTimer);
                        btn.__copyTimer = setTimeout(function () {
                            setCopyBtnState(btn, false);
                        }, 1800);
                    }, function () {
                        btn.classList.remove('copied');
                        btn.innerHTML = COPY_ICON + '<span class="code-copy-text">复制失败，请手动选择</span>';
                        clearTimeout(btn.__copyTimer);
                        btn.__copyTimer = setTimeout(function () {
                            setCopyBtnState(btn, false);
                        }, 2200);
                    });
                };
            })(button, pre.querySelector('code') || pre));
        }
    }

    /* ============================================================
       窄屏目录侧边栏
       目录折叠为悬浮在左侧的侧边栏，通过开关按钮展开 / 收起。
       ============================================================ */
    var TOC_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5h18v2H3V5zm0 6h12v2H3v-2zm0 6h18v2H3v-2z"/></svg>';

    function setMobileTocState(open) {
        var toc = document.getElementById('article-toc');
        var article = document.querySelector('main article');
        if (!toc || !article) return;

        article.classList.toggle('toc-open', open);
        toc.classList.toggle('open', open);

        var button = article.querySelector('.toc-toggle');
        if (button) {
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
            var label = button.querySelector('.toc-toggle-text');
            if (label) label.textContent = open ? '收起' : '目录';
        }
    }

    // 点击目录项跳转后自动收起（仅窄屏有展开状态时会生效）
    function closeMobileToc() {
        var article = document.querySelector('main article');
        if (article && article.classList.contains('toc-open')) {
            setMobileTocState(false);
        }
    }

    function initMobileTocSidebar() {
        var toc = document.getElementById('article-toc');
        var article = document.querySelector('main article');
        if (!toc || !article || toc.hidden) return;

        if (!article.querySelector('.toc-toggle')) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'toc-toggle';
            button.setAttribute('aria-controls', 'article-toc');
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-label', '展开文章目录');
            button.innerHTML = TOC_ICON + '<span class="toc-toggle-text">目录</span>';
            button.addEventListener('click', function () {
                var current = document.querySelector('main article');
                setMobileTocState(!(current && current.classList.contains('toc-open')));
            });
            article.appendChild(button);
        }

        // 页面（无刷新）切换后目录默认处于收起状态
        setMobileTocState(false);
    }

    function initArticlePage() {
        fillLicense();
        buildArticleToc();
        var toc = document.getElementById('article-toc');
        markArticleTocState(!!toc && !toc.hidden);
        initMobileTocSidebar();
        initCodeCopy();
    }

    // 注册为可复用的页面模块（无刷新切换后会被重新调用）
    window.__pageModules = window.__pageModules || {};
    window.__pageModules['articles.js'] = initArticlePage;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initArticlePage);
    } else if (!window.__pjaxDynamicLoad) {
        initArticlePage();
    }
})();

// 加载进度条逻辑已统一迁移至 /js/loading.js（真实进度），此处不再包含。
