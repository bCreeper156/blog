// software_list.js
const softwareData = [
    { name: "Firefox", desc: "自由、开源的浏览器，注重隐私与定制性。", tags: ["浏览器", "开源", "隐私"], icon: "🦊", downloadUrl: "https://www.mozilla.org/firefox/" },
    { name: "Visual Studio Code", desc: "轻量但强大的代码编辑器，支持海量扩展。", tags: ["开发工具", "编辑器", "微软"], icon: "📝", downloadUrl: "https://code.visualstudio.com/" },
    { name: "7-Zip", desc: "高压缩率、开源免费的文件归档工具。", tags: ["压缩工具", "开源"], icon: "🗜️", downloadUrl: "https://www.7-zip.org/" },
    { name: "Bitwarden", desc: "跨平台密码管理器，端到端加密。", tags: ["安全", "密码管理", "开源"], icon: "🔐", downloadUrl: "https://bitwarden.com/" },
    { name: "OBS Studio", desc: "免费开源的直播和录制软件。", tags: ["录屏", "直播", "开源"], icon: "🎥", downloadUrl: "https://obsproject.com/" },
    { name: "GIMP", desc: "功能强大的开源图像处理软件。", tags: ["图像处理", "开源"], icon: "🎨", downloadUrl: "https://www.gimp.org/" }
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
