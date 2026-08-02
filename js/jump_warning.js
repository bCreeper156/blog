// ========== 自动给所有外部链接添加安全跳转 ==========
(function() {
    'use strict';

    // 如果当前页面就是跳转页，则不再执行任何处理，避免循环
    if (window.location.pathname === '/jump_warning.html') {
        return;
    }

    const JUMP_BASE = '/jump_warning.html?url=';

        function shouldProcess(href) {
        if (!href) return false;
        // ① 已经是跳转链接或者跳转页本身，直接跳过，防止死循环
        if (href.startsWith(JUMP_BASE)) return false;
        if (href.startsWith('/jump_warning.html')) return false;
        if (href.includes('/jump_warning.html?url=')) return false;
        
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
