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
});