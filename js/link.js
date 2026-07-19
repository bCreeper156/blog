// ==============================
// 【1. 数据放在 JS 最顶端】
// ==============================
const linkData = {
    // 快捷链接
    shortcuts: [
        { title: "GitHub", desc: "代码托管与开源项目", url: "https://github.com/bCreeper156" },
        { title: "Bilibili", desc: "游戏区、科技区 UP 主", url: "https://space.bilibili.com/3546378363996834" }
    ],
    // 友情链接
    friends: [
        { title: "示例博客", desc: "一个热爱技术的开发者", url: "https://example.com" }
    ],
    // 我的项目
    projects: [
        { 
            title: "156博客源码", 
            desc: "本博客的纯静态源代码。", 
            btn1_name: "GitHub查看", 
            btn1_url: "https://github.com/bCreeper156/blog",
            btn2_name: "博客内查看（暂未开放）", 
            btn2_url: "#" 
        }
    ]
};

// ==============================
// 【2. 渲染与逻辑（后续不需要再动）】
// ==============================
function renderCards(id, items, type) {
    const container = document.getElementById(id);
    let html = '';
    items.forEach(item => {
        if (type === 'project') {
            html += `
                <div class="link-card">
                    <div class="info"><h4>${item.title}</h4><p>${item.desc}</p></div>
                    <div style="display:flex; gap:8px; margin-top:10px;">
                        <a href="${item.btn1_url}" target="_self" class="card-btn primary">${item.btn1_name} →</a>
                        <a href="${item.btn2_url}" target="_self" class="card-btn">${item.btn2_name} →</a>
                    </div>
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

// 执行渲染
renderCards('shortcut-grid', linkData.shortcuts);
renderCards('friend-grid', linkData.friends);
renderCards('project-grid', linkData.projects, 'project');

// 自动生成左侧侧边栏菜单
const menuKeys = [
    { id: 'section-shortcuts', name: '⚡ 快捷链接' },
    { id: 'section-friends', name: '🤝 友情链接' },
    { id: 'section-projects', name: '🛠️ 我的项目' }
];
document.getElementById('menu-list').innerHTML = menuKeys.map(k => 
    `<a href="#${k.id}">${k.name}</a>`
).join('');

// 滚动监听（自动高亮侧边栏/移动目录）
const sections = document.querySelectorAll('.link-page .section');
const sidebarLinks = document.querySelectorAll('.link-page .sidebar a');
window.addEventListener('scroll', () => {
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
});
