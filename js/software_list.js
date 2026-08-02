// software_list.js (V2.1.0 完整版 - 带ID精准跳转与重置)
const softwareData = [
    { 
        id: 1,
        name: "希沃白板5 - 插件 - 一体机模式", 
        desc: "为一体机提供更好的教学体验", 
        tags: ["希沃白板5", "一体机", "插件"], 
        icon: "🏫", 
        downloadUrl: "https://gh-proxy.com/https://github.com/bCreeper156/blog_files/raw/refs/heads/main/%E6%8F%92%E4%BB%B6%EF%BC%9APC%E5%81%87%E8%A3%85%E6%98%AF%E4%B8%80%E4%BD%93%E6%9C%BA.exe",
        backupDownloadUrl: "https://github.com/bCreeper156/blog_files/raw/refs/heads/main/%E6%8F%92%E4%BB%B6%EF%BC%9APC%E5%81%87%E8%A3%85%E6%98%AF%E4%B8%80%E4%BD%93%E6%9C%BA.exe"
    },
    { 
        id: 2,
        name: "Typedown - Markdown编辑器", 
        desc: "轻量级Markdown编辑器，支持实时预览", 
        tags: ["Typedown", "Markdown", "编辑器"], 
        icon: "📝", 
        downloadUrl: "https://gh-proxy.com/https://github.com/bCreeper156/blog_files/raw/refs/heads/main/Typedown%20Installer.exe",
        backupDownloadUrl: "https://github.com/bCreeper156/blog_files/raw/refs/heads/main/Typedown%20Installer.exe"
    }
];

let currentView = 'grid';
let filteredData = [...softwareData];

function renderSoftwareList() {
    const container = document.getElementById('software-list');
    const emptyDiv = document.getElementById('software-empty');
    const searchInput = document.getElementById('software-search');
    
    let searchKeyword = '';
    if (searchInput && searchInput.style.display !== 'none') {
        searchKeyword = searchInput.value.trim().toLowerCase();
    }

    if (searchKeyword) {
        filteredData = softwareData.filter(soft =>
            soft.name.toLowerCase().includes(searchKeyword) ||
            soft.desc.toLowerCase().includes(searchKeyword) ||
            soft.tags.some(tag => tag.toLowerCase().includes(searchKeyword))
        );
    }

    if (!container) return;

    container.innerHTML = '';
    container.className = `software-list ${currentView === 'grid' ? 'grid-view' : 'list-view'}`;

    if (filteredData.length === 0) {
        emptyDiv.style.display = 'block';
        return;
    }
    emptyDiv.style.display = 'none';

    filteredData.forEach(soft => {
        const li = document.createElement('li');
        li.className = 'software-card';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'software-icon';
        iconDiv.textContent = soft.icon || '📦';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'software-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'software-name';
        nameDiv.textContent = soft.name;

        const descDiv = document.createElement('div');
        descDiv.className = 'software-desc';
        descDiv.textContent = soft.desc;

        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'software-tags';
        soft.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tag;
            tagsDiv.appendChild(span);
        });

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'software-actions';

        const downloadLink = document.createElement('a');
        downloadLink.href = soft.downloadUrl;
        downloadLink.className = 'download-link';
        downloadLink.textContent = '快速下载';
        downloadLink.target = '_blank';
        downloadLink.rel = 'noopener noreferrer';

        const backupLink = document.createElement('a');
        backupLink.href = soft.backupDownloadUrl || soft.downloadUrl;
        backupLink.className = 'download-link secondary';
        backupLink.textContent = '原速下载';
        backupLink.target = '_blank';
        backupLink.rel = 'noopener noreferrer';

        actionsDiv.appendChild(downloadLink);
        actionsDiv.appendChild(backupLink);

        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(descDiv);
        infoDiv.appendChild(tagsDiv);
        infoDiv.appendChild(actionsDiv);

        li.appendChild(iconDiv);
        li.appendChild(infoDiv);
        container.appendChild(li);
    });
}

function setSoftwareView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
        if (btn.getAttribute('data-view') === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderSoftwareList();
}

/* ============================================
   V2.1.0 核心功能：ID检测与重置
   ============================================ */
function resetSoftwareList() {
    // 1. 清除 URL 中的 ?id= 参数
    const url = new URL(window.location);
    if (url.searchParams.has('id')) {
        url.searchParams.delete('id');
        window.history.replaceState({}, '', url);
    }
    
    // 2. 恢复全部数据
    filteredData = [...softwareData];
    
    // 3. 显示搜索框、切换按钮，隐藏重置按钮
    const searchArea = document.querySelector('.search-area');
    const modeSwitch = document.querySelector('.mode-switch');
    const resetBtn = document.getElementById('resetSoftwareBtn');
    if (searchArea) searchArea.style.display = 'block';
    if (modeSwitch) modeSwitch.style.display = 'block';
    if (resetBtn) resetBtn.style.display = 'none';

    // 4. 重新渲染
    renderSoftwareList();
}

function initSoftwarePage() {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');
    const searchArea = document.querySelector('.search-area');
    const modeSwitch = document.querySelector('.mode-switch');
    const resetBtn = document.getElementById('resetSoftwareBtn');

    if (targetId) {
        // ① 如果有 ?id=X，精确匹配数字
        const targetIdNum = parseInt(targetId, 10);
        filteredData = softwareData.filter(item => item.id === targetIdNum);
        
        // 隐藏搜索和切换，显示重置按钮
        if (searchArea) searchArea.style.display = 'none';
        if (modeSwitch) modeSwitch.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'inline-block';
    } else {
        // ② 没有ID，显示全部
        filteredData = [...softwareData];
        if (resetBtn) resetBtn.style.display = 'none';
    }

    // 绑定重置按钮事件
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSoftwareList);
    }

    renderSoftwareList();

    // 原有搜索监听
    const searchInput = document.getElementById('software-search');
    if (searchInput) {
        searchInput.addEventListener('input', renderSoftwareList);
    }

    // 原有视图切换监听
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            if (view === 'grid' || view === 'list') setSoftwareView(view);
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSoftwarePage);
} else {
    initSoftwarePage();
}