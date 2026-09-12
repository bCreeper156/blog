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

    // 注册为可复用的页面模块（无刷新切换后会被重新调用）
    window.__pageModules = window.__pageModules || {};
    window.__pageModules['articles.js'] = fillLicense;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fillLicense);
    } else if (!window.__pjaxDynamicLoad) {
        fillLicense();
    }
})();

// 加载进度条逻辑已统一迁移至 /js/loading.js（真实进度），此处不再包含。
