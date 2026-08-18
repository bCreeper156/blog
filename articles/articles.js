//为每一个文章页面结尾添加版权声明
(function() {
    'use strict';

    // 要插入的 HTML 内容
    var licenseHTML = '本文章被 <a href="https://raw.githubusercontent.com/bCreeper156/blog/refs/heads/main/LICENSE" target="_blank" rel="noopener noreferrer">CC BY-NC-ND 4.0</a> 所保护！<br />如需对本文章做任何操作，请遵循该许可证的所有条款，避免侵权带来的不必要的麻烦！';

    // 获取页面上所有 id 为 "LICENSE" 的元素
    var elements = document.querySelectorAll('#LICENSE');

    // 遍历并填充内容
    for (var i = 0; i < elements.length; i++) {
        elements[i].innerHTML = licenseHTML;
    }
})();
