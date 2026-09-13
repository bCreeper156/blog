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
    // 可选字段 logo_url（或 logoUrl / LOGO_url / logo）：友链 LOGO 图片链接。
    // 填写后卡片左侧显示该图片；不填则自动使用 Google 图标（普通友链为「网络」public 图标）。
    friends: [
        { title: "添加友链", desc: "提交你的博客信息", type: "add-link" },
        { title: "羊角快车Blog", desc: "把有用的东西，合成你需要的模样", url: "https://jiaoblog.dpdns.org/", logo_url: "https://yangjiao.dpdns.org/images/avatar2.png"}
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
// 友链卡片左侧图标：填写 logo_url（或 logoUrl / LOGO_url / logo）时用图片，否则回退 Google Material Symbols 图标
function friendLogoHtml(item, fallbackIcon) {
    const logo = item.logo_url || item.logoUrl || item.LOGO_url || item.logo || '';
    if (logo) {
        return `<span class="friend-logo">
            <img src="${logo}" alt="${item.title || ''}" loading="lazy">
            <span class="material-symbols-rounded" style="display:none;">${fallbackIcon}</span>
        </span>`;
    }
    return `<span class="friend-logo"><span class="material-symbols-rounded">${fallbackIcon}</span></span>`;
}

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
                    <div class="card-head">
                        ${friendLogoHtml(item, 'add_link')}
                        <div class="info"><h4>${item.title}</h4><p>${item.desc}</p></div>
                    </div>
                    <div class="card-foot">添加友链 →</div>
                </div>
            `;
        } else if (type === 'friend' && item.type === 'more-link') {
            html += `
                <a href="${item.url}" class="link-card more-friend-card">
                    <div class="info"><h4>${item.title}</h4><p>${item.desc}</p></div>
                    <div class="card-foot">查看全部 →</div>
                </a>
            `;
        } else if (type === 'friend') {
            html += `
                <a href="${item.url}" target="_self" class="link-card">
                    <div class="card-head">
                        ${friendLogoHtml(item, 'public')}
                        <div class="info"><h4>${item.title}</h4><p>${item.desc}</p></div>
                    </div>
                    <div style="margin-top:10px; color:#10B981; font-size:14px;">查看 →</div>
                </a>
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

    // LOGO 图片加载失败时，自动回退为 Google 图标
    container.querySelectorAll('.friend-logo img').forEach(img => {
        const showFallback = () => {
            img.style.display = 'none';
            const icon = img.nextElementSibling;
            if (icon) icon.style.display = '';
        };
        img.addEventListener('error', showFallback);
        if (img.complete && img.naturalWidth === 0) showFallback();
    });
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
                1. 博客名称：<br>
                2. 博客简介：<br>
                3. 博客链接：<br>
                4. 博客LOGO（可选，需透明,请提供图片在线链接）：
            </div>
            <div class="friend-toast-actions">
                <button type="button" class="toast-btn secondary" data-close-toast>取消</button>
                <a href="mailto://humingxuan20241@outlook.com?subject=友链申请&body=1.博客名称：%0A2.博客简介：%0A3.博客链接：%0A4.博客LOGO：" class="toast-btn primary" data-add-mailto>现在添加</a>
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

// 绑定「添加友链」卡片事件（列表重新渲染后需再次调用）
function bindAddFriendCard() {
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
}

// 自动生成左侧侧边栏菜单
const menuKeys = [
    { id: 'section-shortcuts', name: '<span class="material-symbols-rounded">bolt</span> 快捷链接' },
    { id: 'section-friends', name: '<span class="material-symbols-rounded">handshake</span> 友情链接' },
    { id: 'section-projects', name: '<span class="material-symbols-rounded">build</span> 我的项目' }
];

// 读取地址栏查询参数（如 link.html?type=friends）
function getQueryParam(name) {
    try {
        return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
        return null;
    }
}

// 切换某个区块及其导航入口的显示状态
function toggleSection(sectionId, visible) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = visible ? '' : 'none';
    }
    const anchors = document.querySelectorAll(`a[href="#${sectionId}"]`);
    anchors.forEach(a => {
        a.style.display = visible ? '' : 'none';
    });
}

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
    // link.html?type=friends 时只显示全部友链
    const friendsOnly = getQueryParam('type') === 'friends';

    renderCards('shortcut-grid', linkData.shortcuts);
    // 普通模式下在友链栏底部追加「查看更多友链」卡片；友链模式则不显示
    const friendsList = friendsOnly
        ? linkData.friends
        : linkData.friends.concat([{
            title: '查看更多友链',
            desc: '浏览全部友情链接',
            type: 'more-link',
            url: '/link.html?type=friends'
        }]);
    renderCards('friend-grid', friendsList, 'friend');
    renderCards('project-grid', linkData.projects, 'project');

    // 仅显示友链模式：整个页面只呈现友链，隐藏其它区块与导航
    const pageEl = document.querySelector('.link-page');
    if (pageEl) {
        pageEl.classList.toggle('friends-only', friendsOnly);
    }
    toggleSection('section-shortcuts', !friendsOnly);
    toggleSection('section-projects', !friendsOnly);
    toggleSection('section-friends', true);

    // 仅显示友链模式下：显示返回按钮
    const backBtn = document.getElementById('friend-back');
    if (backBtn) {
        backBtn.hidden = !friendsOnly;
    }

    // 仅显示友链模式下：启用搜索过滤
    const searchWrap = document.getElementById('friend-search-wrap');
    const searchInput = document.getElementById('friend-search');
    if (searchWrap && searchInput) {
        searchWrap.hidden = !friendsOnly;
        if (friendsOnly) {
            searchInput.value = '';
            searchInput.oninput = () => {
                const kw = searchInput.value.trim().toLowerCase();
                const list = kw
                    ? linkData.friends.filter(item =>
                        item.type === 'add-link' ||
                        (item.title || '').toLowerCase().includes(kw) ||
                        (item.desc || '').toLowerCase().includes(kw)
                    )
                    : linkData.friends;
                renderCards('friend-grid', list, 'friend');
                if (kw && !list.some(item => item.type !== 'add-link')) {
                    const grid = document.getElementById('friend-grid');
                    if (grid) {
                        grid.insertAdjacentHTML('beforeend',
                            '<div class="friend-search-empty">未找到匹配的友链</div>');
                    }
                }
                bindAddFriendCard();
            };
        }
    }

    bindAddFriendCard();

    const menuList = document.getElementById('menu-list');
    if (menuList) {
        const keys = friendsOnly
            ? menuKeys.filter(k => k.id === 'section-friends')
            : menuKeys;
        menuList.innerHTML = keys.map(k =>
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