(function() {
    const loaderWrapId = 'gh-loader-wrap';
    const loaderId = 'gh-loader';
    const loaderTipId = 'gh-loader-tip';

    function createLoaderElements() {
        if (document.getElementById(loaderWrapId)) return;

        const wrap = document.createElement('div');
        wrap.id = loaderWrapId;
        wrap.innerHTML = '<div id="'+loaderId+'"></div>';

        const tip = document.createElement('div');
        tip.id = loaderTipId;
        tip.textContent = '加载中 0%';

        document.documentElement.appendChild(wrap);
        document.documentElement.appendChild(tip);
    }

    function setProgress(value, text) {
        const bar = document.getElementById(loaderId);
        const wrap = document.getElementById(loaderWrapId);
        const tip = document.getElementById(loaderTipId);
        if (!bar || !wrap || !tip) return;

        const pct = Math.min(100, Math.max(0, Math.round(value)));
        bar.style.width = pct + '%';
        tip.textContent = text || `加载中 ${pct}%`;

        if (pct >= 100) {
            wrap.classList.add('hide');
            tip.classList.remove('show');
        } else {
            wrap.classList.remove('hide');
            tip.classList.add('show');
        }
    }

    function getProgressByResources() {
        const resources = performance.getEntriesByType('resource') || [];
        if (resources.length === 0) return 0;
        const loadedCount = resources.filter(r => r.responseEnd > 0).length;
        return Math.round((loadedCount / resources.length) * 70);
    }

    function updateLoader() {
        const state = document.readyState;
        if (state === 'loading') {
            setProgress(8, '开始加载页面...');
        } else if (state === 'interactive') {
            const p = Math.max(35, getProgressByResources());
            setProgress(p, `DOM 已就绪 ${p}%`);
        } else if (state === 'complete') {
            setProgress(94, '资源加载中...');
        }
    }

    createLoaderElements();
    updateLoader();
    const interval = setInterval(() => {
        updateLoader();
        if (document.readyState === 'complete') {
            clearInterval(interval);
        }
    }, 100);

    window.addEventListener('load', () => {
        setProgress(100, '加载完成，欢迎回来！');
        setTimeout(() => {
            const wrap = document.getElementById(loaderWrapId);
            const tip = document.getElementById(loaderTipId);
            if(wrap) wrap.classList.add('hide');
            if(tip) tip.classList.remove('show');
        }, 260);
    });
})();

// 移动端菜单功能

document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.querySelector('.menu');
    const nav = document.querySelector('nav ul');
    
    if (menuButton && nav) {
        menuButton.addEventListener('click', function() {
            nav.classList.toggle('show');
        });
        
        // 点击菜单外区域关闭菜单
        document.addEventListener('click', function(e) {
            if (!e.target.closest('header')) {
                nav.classList.remove('show');
            }
        });
    }
    
    // 页面加载动画
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.4s';
        document.body.style.opacity = '1';
    }, 100);

    // 评论区本地存储 + fallback
    initCommentSection();
});

function initCommentSection() {
    // Giscus 会自动在具有 class="giscus" 的元素中加载评论
    // 无需额外操作
}
// ==================== 自动给所有外部链接添加安全跳转 ====================
(function() {
    'use strict';

    const JUMP_BASE = '/jump_warning?url=';
    // 判断是否为需要处理的链接（http/https 且不是站内）
    function shouldProcess(href) {
        if (!href) return false;
        // 已经是跳转链接，跳过
        if (href.startsWith(JUMP_BASE)) return false;
        // 站内链接：以 '/' 开头、'#'、javascript:、mailto:、tel: 等
        if (href.startsWith('/') || href.startsWith('#') || href.startsWith('javascript:') ||
            href.startsWith('mailto:') || href.startsWith('tel:')) {
            return false;
        }
        // 只处理 http:// 或 https:// 开头的链接
        return (href.startsWith('http://') || href.startsWith('https://'));
    }

    // 处理单个链接元素
    function processLink(link) {
        let href = link.getAttribute('href');
        if (!shouldProcess(href)) return;
        // 避免重复处理已带有跳转前缀的（保险）
        if (href.startsWith(JUMP_BASE)) return;
        const encoded = encodeURIComponent(href);
        link.setAttribute('href', JUMP_BASE + encoded);
        if (!link.getAttribute('target')) link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    }

    // 扫描并处理当前文档中的所有 <a> 标签
    function processAllLinks() {
        const links = document.querySelectorAll('a[href]');
        links.forEach(processLink);
    }

    // 使用 MutationObserver 监听动态添加的节点，处理新加入的链接
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 如果新节点本身是 <a> 标签
                        if (node.matches && node.matches('a[href]')) {
                            processLink(node);
                        }
                        // 如果新节点包含子元素中的 <a> 标签
                        if (node.querySelectorAll) {
                            const childLinks = node.querySelectorAll('a[href]');
                            childLinks.forEach(processLink);
                        }
                    }
                }
            }
        }
    });

    // 启动观察器（监听整个文档的子树变化）
    function startObserver() {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 页面加载完成后执行一次，并启动观察器
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            processAllLinks();
            startObserver();
            // 再次确保在 load 事件中也处理一次
            window.addEventListener('load', processAllLinks);
        });
    } else {
        processAllLinks();
        startObserver();
    }
})();
