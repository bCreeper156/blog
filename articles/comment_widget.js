(function () {
    'use strict';

    var COMMENT_ORIGIN = 'https://cf-comment-system.c156.workers.dev';
    var SITE_KEY = '<KEY>';
        var frameReady = false;
    var frame;

    function currentArticleId() {
        var pathSegments = window.location.pathname.split('/').filter(Boolean);
        if (pathSegments[pathSegments.length - 1] === 'index.html') pathSegments.pop();
        return pathSegments[pathSegments.length - 1] || 'default';
    }

    function currentTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function sendTheme() {
        if (!frameReady || !frame || !frame.contentWindow) return;
        frame.contentWindow.postMessage({ type: 'setTheme', theme: currentTheme() }, COMMENT_ORIGIN);
    }

    function buildFrame() {
        var params = new URLSearchParams({
            site_key: SITE_KEY,
            article_id: currentArticleId(),
            parent_origin: window.location.origin
        });
        var iframe = document.createElement('iframe');
        iframe.className = 'cf-comment-frame';
        iframe.title = '文章评论与点赞';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.src = COMMENT_ORIGIN + '/?' + params.toString();
        iframe.style.height = '640px';
        return iframe;
    }

    function handleFrameMessage(event) {
        if (event.origin !== COMMENT_ORIGIN || !frame || event.source !== frame.contentWindow) return;
        if (event.data && event.data.type === 'cf-comment-ready') {
            frameReady = true;
            sendTheme();
        } else if (event.data && event.data.type === 'cf-comment-resize') {
            var height = Number(event.data.height);
            if (Number.isFinite(height)) frame.style.height = Math.max(320, Math.min(height, 10000)) + 'px';
        }
    }

    function initialize() {
        var article = document.querySelector('main > article');
        var actions = article && article.querySelector('.article-actions');
        if (!actions) return;

        var existing = document.getElementById('cf-comment-root');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

        var root = document.createElement('section');
        root.className = 'cf-comment-widget';
        root.id = 'cf-comment-root';
        root.setAttribute('aria-label', '文章评论');
        frame = buildFrame();
        frameReady = false;
        root.appendChild(frame);
        actions.parentNode.insertBefore(root, actions);
    }

    if (!window.__cfCommentMessageBound) {
        window.__cfCommentMessageBound = true;
        window.addEventListener('message', handleFrameMessage);
        var observer = new MutationObserver(sendTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    window.__pageModules = window.__pageModules || {};
    window.__pageModules['comment_widget.js'] = initialize;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else if (!window.__pjaxDynamicLoad) {
        initialize();
    }
})();
