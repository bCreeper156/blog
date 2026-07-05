// software_list.js
const softwareData = [
    { name: "希沃白板5 - 插件 - 一体机模式", desc: "为一体机提供更好的教学体验", tags: ["希沃白板5", "一体机", "插件"], icon: "🏫", downloadUrl: "https://pan.mcbebbs.cn/s/3xaF8" }
];
let currentView = 'grid';
let filteredData = [...softwareData];

function renderSoftwareList() {
    const container = document.getElementById('software-list');
    const emptyDiv = document.getElementById('software-empty');
    const searchKeyword = document.getElementById('software-search').value.trim().toLowerCase();

    if (searchKeyword) {
        filteredData = softwareData.filter(soft =>
            soft.name.toLowerCase().includes(searchKeyword) ||
            soft.desc.toLowerCase().includes(searchKeyword) ||
            soft.tags.some(tag => tag.toLowerCase().includes(searchKeyword))
        );
    } else {
        filteredData = [...softwareData];
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

        // 图标
        const iconDiv = document.createElement('div');
        iconDiv.className = 'software-icon';
        iconDiv.textContent = soft.icon || '📦';

        // 信息区
        const infoDiv = document.createElement('div');
        infoDiv.className = 'software-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'software-name';
        nameDiv.textContent = soft.name;

        const descDiv = document.createElement('div');
        descDiv.className = 'software-desc';
        descDiv.textContent = soft.desc;

        // 标签区（居中）
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'software-tags';
        soft.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tag;
            tagsDiv.appendChild(span);
        });

        // 下载链接（添加跳转警告前缀）
        const downloadLink = document.createElement('a');
        const encodedUrl = encodeURIComponent(soft.downloadUrl);
        downloadLink.href = `/jump_warning.html?url=${encodedUrl}`;
        downloadLink.className = 'download-link';
        downloadLink.textContent = '访问官网 / 下载';
        downloadLink.target = '_blank';
        downloadLink.rel = 'noopener noreferrer';

        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(descDiv);
        infoDiv.appendChild(tagsDiv);
        infoDiv.appendChild(downloadLink);

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

function initSoftwarePage() {
    renderSoftwareList();

    const searchInput = document.getElementById('software-search');
    if (searchInput) {
        searchInput.addEventListener('input', renderSoftwareList);
    }

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
