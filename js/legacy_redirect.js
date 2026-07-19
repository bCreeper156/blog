/* ==========================================
   156博客 - 老旧浏览器拦截脚本（ES5防报错）
   ========================================== */
(function() {
    var ua = navigator.userAgent;
    var redirectUrl = '/legacy_browser.html';

    // 1. 检测 IE 浏览器（IE6-11）
    var isIE = /*@cc_on!@*/false || !!document.documentMode;
    if (isIE) {
        window.location.href = redirectUrl;
        return;
    }

    // 2. 检测 XP 时代的旧版 Chrome（Chrome 49 及以下）
    var chromeMatch = ua.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
        var chromeVersion = parseInt(chromeMatch[1], 10);
        if (chromeVersion < 50) {
            window.location.href = redirectUrl;
            return;
        }
    }
})();
