/**
 * nope.js - 全站统一弹窗组件（主站自动屏蔽版 + 今日不再提示 + 主站文字纯文本）
 * 功能：仅在非主站页面且今日未关闭时弹窗，引导前往主站并同步当前路径。
 * 版本：2.4.0
 */

(function() {
    // ======================== 配置 ========================
    const STORAGE_KEY = 'creeper156_popup_main_site_hide_date'; // 变更键名，专门记录日期
    const MAIN_SITE_DOMAIN = '156blog.pages.dev';
    const MAIN_SITE_PROTOCOL = 'https://';
    const POPUP_DELAY = 200;
    // =====================================================

    // 获取主站目标 URL（保留路径、查询、hash）
    function getTargetMainUrl() {
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const currentHash = window.location.hash;
        return `${MAIN_SITE_PROTOCOL}${MAIN_SITE_DOMAIN}${currentPath}${currentSearch}${currentHash}`;
    }

    // 判断是否已在主站
    function isAlreadyOnMainSite() {
        const currentHost = window.location.hostname;
        return currentHost === MAIN_SITE_DOMAIN || currentHost === `www.${MAIN_SITE_DOMAIN}`;
    }

    // 获取今天的日期字符串（格式：YYYY-MM-DD）
    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 弹窗 HTML（更新底部文案）
    const createPopupHTML = () => {
        return `
        <div id="nope-popup-overlay" class="nope-overlay">
            <div class="nope-popup-container">
                <button class="nope-close-btn" aria-label="关闭">&times;</button>
                <div class="nope-popup-icon">✨</div>
                <h3 class="nope-popup-title">发现更多精彩</h3>
                <p class="nope-popup-message">
                    前往 主站 体验更多功能<br>
                    <span style="font-size:0.8rem; opacity:0.7;">将自动跳转到当前页面</span>
                </p>
                <div class="nope-popup-actions">
                    <button class="nope-btn nope-btn-primary" id="nope-go-main">前往主站 →</button>
                    <button class="nope-btn nope-btn-secondary" id="nope-close-popup">暂不，关闭</button>
                </div>
                <p class="nope-popup-footnote">今日不再提示，下次访问仍会提示</p>
            </div>
        </div>
    `;};

    // 注入样式（保持不变）
    const injectStyles = () => {
        const styleId = 'nope-popup-styles';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .nope-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(3px);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                animation: nope-fade-in 0.2s ease-out;
            }
            .nope-popup-container {
                background: #ffffff;
                max-width: 400px;
                width: 90%;
                margin: 20px;
                border-radius: 28px;
                box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.25);
                padding: 24px 20px 28px;
                text-align: center;
                position: relative;
                animation: nope-slide-up 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1);
            }
            .nope-close-btn {
                position: absolute;
                top: 16px;
                right: 20px;
                background: none;
                border: none;
                font-size: 28px;
                line-height: 1;
                cursor: pointer;
                color: #9ca3af;
                padding: 4px 8px;
                border-radius: 40px;
                transition: background 0.2s, color 0.2s;
            }
            .nope-close-btn:hover {
                background-color: #f3f4f6;
                color: #374151;
            }
            .nope-popup-icon {
                font-size: 48px;
                margin-bottom: 8px;
            }
            .nope-popup-title {
                font-size: 1.7rem;
                font-weight: 700;
                margin: 8px 0 8px;
                color: #1f2937;
                letter-spacing: -0.3px;
            }
            .nope-popup-message {
                font-size: 1rem;
                color: #4b5563;
                margin: 16px 0 12px;
                line-height: 1.5;
            }
            .nope-popup-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 20px;
                flex-wrap: wrap;
            }
            .nope-btn {
                border: none;
                padding: 10px 20px;
                border-radius: 60px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                background-color: #f3f4f6;
                color: #374151;
            }
            .nope-btn-primary {
                background: linear-gradient(135deg, #2563eb, #1e40af);
                color: white;
                box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
            }
            .nope-btn-primary:hover {
                background: linear-gradient(135deg, #1d4ed8, #1e3a8a);
                transform: translateY(-1px);
                box-shadow: 0 8px 18px rgba(37, 99, 235, 0.25);
            }
            .nope-btn-secondary {
                background: #f3f4f6;
                border: 1px solid #e5e7eb;
            }
            .nope-btn-secondary:hover {
                background-color: #e5e7eb;
            }
            .nope-popup-footnote {
                font-size: 0.7rem;
                color: #9ca3af;
                margin-top: 20px;
                margin-bottom: 0;
            }
            @keyframes nope-fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes nope-slide-up {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.96);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            @media (max-width: 480px) {
                .nope-popup-container { padding: 20px 16px 24px; }
                .nope-popup-title { font-size: 1.5rem; }
                .nope-btn { padding: 8px 18px; }
            }
        `;
        document.head.appendChild(style);
    };

    // 移除弹窗
    const removePopup = () => {
        const overlay = document.getElementById('nope-popup-overlay');
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    // 点击关闭：记录今天的日期，今日内不再弹窗
    const closeAndSaveDate = () => {
        try { 
            localStorage.setItem(STORAGE_KEY, getTodayString()); 
        } catch(e) {}
        removePopup();
    };

    // 前往主站：同样记录日期，避免用户返回备用站时立刻又弹出来
    const goToMainSite = () => {
        try { 
            localStorage.setItem(STORAGE_KEY, getTodayString()); 
        } catch(e) {}
        const targetUrl = getTargetMainUrl();
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
        removePopup();
    };

    // 绑定事件
    const bindEvents = () => {
        const closeBtn = document.getElementById('nope-close-popup');
        const closeX = document.querySelector('.nope-close-btn');
        const goBtn = document.getElementById('nope-go-main');
        const overlay = document.getElementById('nope-popup-overlay');
        
        if (closeBtn) closeBtn.addEventListener('click', closeAndSaveDate);
        if (closeX) closeX.addEventListener('click', closeAndSaveDate);
        if (goBtn) goBtn.addEventListener('click', goToMainSite);
        if (overlay) overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAndSaveDate();
        });
    };

    // 初始化逻辑
    const init = () => {
        // 如果已经是主站，直接退出
        if (isAlreadyOnMainSite()) return;

        // 检查今日是否已关闭过
        try {
            const savedDate = localStorage.getItem(STORAGE_KEY);
            if (savedDate === getTodayString()) {
                return; // 如果记录的日期是今天，直接拦截不弹窗
            }
        } catch (e) {}

        // 执行弹窗渲染
        setTimeout(() => {
            injectStyles();
            const wrapper = document.createElement('div');
            wrapper.innerHTML = createPopupHTML();
            document.body.appendChild(wrapper.firstElementChild);
            bindEvents();
        }, POPUP_DELAY);
    };

    // 确保在 DOM 加载完成后运行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
