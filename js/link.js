// ==============================
// 【1. 数据放在 JS 最顶端】
// ==============================
(function () {
'use strict';

const linkData = {
    // 快捷链接
    shortcuts: [
        { title: "GitHub", desc: "代码托管与开源项目", url: "https://github.com/bCreeper156" },
        { title: "Bilibili", desc: "游戏区、科技区 UP 主", url: "https://space.bilibili.com/3546378363996834" },
        { title: "更多联系方式", desc: "查看我的全部联系方式", url: "/contact.html" }
    ],
    // 友情链接
    friends: [
        { title: "添加友链", desc: "提交你的博客信息", type: "add-link" },
        { title: "羊角快车Blog", desc: "把有用的东西，合成你需要的模样", url: "https://jiaoblog.dpdns.org/" }
    ],
    // 我的项目
    projects: [
        {
            title: "156博客源码",
            desc: "本博客的纯静态源代码。",
            githubName: "GitHub查看",
            githubUrl: "https://github.com/bCreeper156/blog",
            hasOnlinePreview: false
        },
        {
            title: "156 2FA软件",
            desc: "一款本地优先的软件",
            githubName: "GitHub查看",
            githubUrl: "https://github.com/bCreeper156/156-2FA",
            hasOnlinePreview: false
        }
    ]
};

// ==============================
// 【2. 渲染与逻辑（后续不需要再动）】
// ==============================
function renderCards(id, items, type) {
    const container = document.getElementById(id);
    if (!container) return;
    let html = '';
    items.forEach(item => {
        if (type === 'project') {
            const onlineBtn = item.hasOnlinePreview
                ? `<a href="${item.onlineUrl}" target="_self" class="card-btn">博客内查看 →</a>`
                : '';
            html += `
                <div class="link-card">
                    <div class="info"><h4>${item.title}</h4><p>${item.desc}</p></div>
                    <div style="display:flex; gap:8px; margin-top:10px;">
                        <a href="${item.githubUrl}" target="_self" class="card-btn primary">${item.githubName} →</a>
                        ${onlineBtn}
                    </div>
                </div>
            `;
        } else if (type === 'friend' && item.type === 'add-link') {
            html += `
                <div class="link-card add-friend-card" role="button" tabindex="0" data-add-friend>
                    <div class="info"><h4>${item.title}</h4><p>${item.desc}</p></div>
                    <div class="card-foot">添加友链 →</div>
                </div>
            `;
        } else {
            html += `
                <a href="${item.url}" target="_self" class="link-card">
                    <div class="info"><h4>${item.title}</h4><p>${item.desc}</p></div>
                    <div style="margin-top:10px; color:#10B981; font-size:14px;">查看 →</div>
                </a>
            `;
        }
    });
    container.innerHTML = html;
}

function createAddFriendToast() {
    if (document.getElementById('friend-link-toast')) {
        return;
    }

    const toast = document.createElement('div');
    toast.id = 'friend-link-toast';
    toast.className = 'friend-link-toast';
    toast.innerHTML = `
        <div class="friend-toast-box">
            <div class="friend-toast-header">添加友链</div>
            <div class="friend-toast-content">
                1. 博客名称<br>
                2. 博客简介<br>
                3. 博客链接
            </div>
            <div class="friend-toast-actions">
                <button type="button" class="toast-btn secondary" data-close-toast>取消</button>
                <a href="mailto://humingxuan20241@outlook.com?subject=友链申请&body=1.博客名称%0A2.博客简介%0A3.博客链接" class="toast-btn primary" data-add-mailto>现在添加</a>
            </div>
        </div>
    `;

    document.body.appendChild(toast);

    toast.querySelector('[data-close-toast]').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 180);
    });

    toast.addEventListener('click', (event) => {
        if (event.target === toast) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 180);
        }
    });
}

function openAddFriendToast() {
    createAddFriendToast();
    const toast = document.getElementById('friend-link-toast');
    if (toast) {
        requestAnimationFrame(() => toast.classList.add('show'));
    }
}

// 自动生成左侧侧边栏菜单
const menuKeys = [
    { id: 'section-shortcuts', name: '⚡ 快捷链接' },
    { id: 'section-friends', name: '🤝 友情链接' },
    { id: 'section-projects', name: '🛠️ 我的项目' }
];

// 滚动监听（自动高亮侧边栏/移动目录）—— 整个文档只绑定一次，实时查询当前 DOM
function onPageScroll() {
    const sections = document.querySelectorAll('.link-page .section');
    const sidebarLinks = document.querySelectorAll('.link-page .sidebar a');
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150; // 提前判定
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    sidebarLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
}
if (!window.__linkScrollBound) {
    window.__linkScrollBound = true;
    window.addEventListener('scroll', onPageScroll, { passive: true });
}

// 页面初始化（首次加载与无刷新页面切换后都会调用，需保证可重复执行）
function initLinkPage() {
    renderCards('shortcut-grid', linkData.shortcuts);
    renderCards('friend-grid', linkData.friends, 'friend');
    renderCards('project-grid', linkData.projects, 'project');

    const addFriendCard = document.querySelector('[data-add-friend]');
    if (addFriendCard && !addFriendCard.dataset.bound) {
        addFriendCard.dataset.bound = '1';
        addFriendCard.addEventListener('click', openAddFriendToast);
        addFriendCard.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openAddFriendToast();
            }
        });
    }

    const menuList = document.getElementById('menu-list');
    if (menuList) {
        menuList.innerHTML = menuKeys.map(k =>
            `<a href="#${k.id}">${k.name}</a>`
        ).join('');
    }

    onPageScroll();
}

// 注册为可复用的页面模块
window.__pageModules = window.__pageModules || {};
window.__pageModules['link.js'] = initLinkPage;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLinkPage);
} else if (!window.__pjaxDynamicLoad) {
    initLinkPage();
}

})();
