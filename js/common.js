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
