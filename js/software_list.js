const softwareItems = [
    {
        id: 1,
        title: 'Sollin 开源音乐伴侣',
        description: '将多个音乐应用与播放体验整合为一个开源客户端，支持快速搜索、远程播放和离线缓存。',
        tags: ['音乐', '开源', '助手'],
        meta: '音频·助手·2026',
        link: '/articles/3/index.html',
        icon: '♪'
    },
    {
        id: 2,
        title: 'Cloudreve 私有云盘',
        description: '一款轻量级个人云盘系统，适合自建存储、文件共享和媒体管理。',
        tags: ['云盘', '私有云', '同步'],
        meta: '存储·自托管·2026',
        link: '/articles/4/index.html',
        icon: '☁'
    }
];

let currentView = 'grid';
let currentQuery = '';

function renderSoftwareCards() {
    const listElement = document.getElementById('software-list');
    const emptyElement = document.getElementById('software-empty');
    const sanitizedQuery = currentQuery.trim().toLowerCase();
    const filteredItems = softwareItems.filter(item => {
        if (!sanitizedQuery) return true;
        const searchable = `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
        return searchable.includes(sanitizedQuery);
    });

    if (filteredItems.length === 0) {
        listElement.innerHTML = '';
        emptyElement.hidden = false;
        return;
    }

    emptyElement.hidden = true;
    listElement.className = `software-list ${currentView}`;
    listElement.innerHTML = filteredItems.map(item => {
        const tagHtml = item.tags.map(tag => `<span class="software-tag">${tag}</span>`).join('');
        const cardClass = currentView === 'list' ? 'software-card list' : 'software-card';
        const description = currentView === 'list'
            ? `<p class="software-desc">${item.description}</p>`
            : `<p class="software-desc">${item.description}</p>`;

        return `
            <li class="${cardClass}">
                <div class="software-thumb">${item.icon}</div>
                <div class="software-content">
                    <div>
                        <h3 class="software-title"><a href="${item.link}">${item.title}</a></h3>
                        ${description}
                    </div>
                    <div class="software-meta">
                        <span class="software-badge">${item.meta}</span>
                        <div class="software-tags">${tagHtml}</div>
                    </div>
                </div>
                <div class="software-actions">
                    <a href="${item.link}">查看详情</a>
                </div>
            </li>
        `;
    }).join('');
}

function initializeSoftwarePage() {
    const searchInput = document.getElementById('software-search');
    const viewButtons = document.querySelectorAll('.view-btn');

    if (!searchInput) return;

    searchInput.addEventListener('input', event => {
        currentQuery = event.target.value;
        renderSoftwareCards();
    });

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentView = button.dataset.view || 'grid';
            viewButtons.forEach(btn => btn.classList.toggle('active', btn === button));
            renderSoftwareCards();
        });
    });

    renderSoftwareCards();
}

window.addEventListener('DOMContentLoaded', initializeSoftwarePage);
