// 完善的文章数据
const articles = [
    {
        id: 1,
        title: "1.欢迎来到我的博客！",
        excerpt: "这是我的个人博客，在这里我会分享编程学习心得、技术经验和创作内容",
        category: "公告",
        date: "2025-09-15",
        readTime: "2分钟阅读",
        link: "/articles/1/article1.html"
    },
    {
        id: 2,
        title: "2.关于下载页面项目下线的公告",
        excerpt: "关于下载页面项目下线的公告",
        category: "公告",
        date: "2025-12-07",
        readTime: "1分钟阅读",
        link: "/articles/11/article11.html"
    },
    {
        id: 3,
        title: "3.【Creeper的软件测评】第一集：我把三大音乐App“装”进了一个软件！免费开源神器Sollin测评",
        excerpt: "免费开源神器Sollin测评",
        category: "软件测评, 开源工具, 音乐播放器",
        date: "2026-1-17",
        readTime: "1分钟阅读",
        link: "/articles/12/article12.html"
    }
];

// 分页配置
const ARTICLES_PER_PAGE = 5;
let currentPage = 1;
let currentArticles = [...articles];
let currentFilter = 'all';
let currentSearch = '';

// 渲染文章列表
function renderArticles(articlesToRender, page = 1) {
    const container = document.getElementById('articles-container');
    currentPage = page;
    
    // 计算分页
    const startIndex = (page - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    const paginatedArticles = articlesToRender.slice(startIndex, endIndex);
    
    if (paginatedArticles.length === 0) {
        container.innerHTML = `
            <li class="empty-state">
                <h3>没有找到相关文章</h3>
                <p>尝试使用其他搜索词或筛选条件</p>
            </li>
        `;
        renderPagination(articlesToRender.length, page);
        return;
    }
    
    container.innerHTML = paginatedArticles.map(article => `
        <li class="article-item" data-category="${article.category}">
            <div class="article-content">
                <h3 class="article-title">
                    <a href="${article.link}">${article.title}</a>
                </h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-meta">
                    <span class="meta-item">
                        <span class="meta-icon">📅</span> ${article.date}
                    </span>
                    <span class="meta-item">
                        <span class="meta-icon">⏱️</span> ${article.readTime}
                    </span>
                </div>
            </div>
            ${article.category !== '公告' ? `<span class="article-category">${article.category}</span>` : ''}
            <div class="article-actions">
                <button class="action-btn" title="收藏" onclick="toggleFavorite(${article.id})">⭐</button>
                <button class="action-btn" title="分享" onclick="shareArticle(${article.id})">↗️</button>
            </div>
        </li>
    `).join('');
    
    renderPagination(articlesToRender.length, page);
}

// 渲染分页组件
function renderPagination(totalArticles, currentPage) {
    const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);
    const paginationContainer = document.querySelector('.pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 上一页按钮
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn prev-btn" data-page="${currentPage - 1}">‹ 上一页</button>`;
    }
    
    // 页码按钮
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // 调整起始页，确保显示maxVisiblePages个页码
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 第一页和省略号
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // 页码
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active" data-page="${i}">${i}</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
        }
    }
    
    // 最后一页和省略号
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // 下一页按钮
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn next-btn" data-page="${currentPage + 1}">下一页 ›</button>`;
    }
    
    // 添加页面信息
    const startItem = (currentPage - 1) * ARTICLES_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ARTICLES_PER_PAGE, totalArticles);
    paginationHTML += `<div class="pagination-info">显示 ${startItem}-${endItem} 条，共 ${totalArticles} 条</div>`;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // 添加分页按钮事件监听
    document.querySelectorAll('.pagination-btn').forEach(button => {
        button.addEventListener('click', function() {
            const page = parseInt(this.getAttribute('data-page'));
            applyFiltersAndSearch(page);
        });
    });
}

// 应用筛选和搜索
function applyFiltersAndSearch(page = 1) {
    let filteredArticles = [...articles];
    
    // 应用分类筛选
    if (currentFilter !== 'all') {
        filteredArticles = filteredArticles.filter(article => article.category === currentFilter);
    }
    
    // 应用搜索
    if (currentSearch) {
        filteredArticles = filteredArticles.filter(article => 
            article.title.toLowerCase().includes(currentSearch) || 
            article.excerpt.toLowerCase().includes(currentSearch)
        );
    }
    
    currentArticles = filteredArticles;
    renderArticles(filteredArticles, page);
}

// 实用功能
function toggleFavorite(articleId) {
    const article = articles.find(a => a.id === articleId);
    const btn = event.target;
    btn.classList.toggle('favorited');
    if (btn.classList.contains('favorited')) {
        btn.style.color = '#ffd700';
        alert(`已收藏文章: ${article.title}`);
    } else {
        btn.style.color = '';
    }
}

function shareArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (navigator.share) {
        navigator.share({
            title: article.title,
            text: article.excerpt,
            url: window.location.origin + article.link
        });
    } else {
        alert(`分享文章: ${article.title}\n链接: ${article.link}`);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    renderArticles(articles, 1);
    
    // 筛选功能
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            currentFilter = this.getAttribute('data-filter');
            applyFiltersAndSearch(1); // 重置到第一页
        });
    });

    // 搜索功能
    document.getElementById('search').addEventListener('input', function() {
        currentSearch = this.value.toLowerCase();
        applyFiltersAndSearch(1); // 重置到第一页
    });
});