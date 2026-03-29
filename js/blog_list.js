// 完善的文章数据
const articles = [
    {
        id: 1,
        title: "1.欢迎来到我的博客！",
        excerpt: "这是我的个人博客，在这里我会分享编程学习心得、技术经验和创作内容",
        category: "公告",
        date: "2025-09-15",
        readTime: "1分钟阅读",
        link: "/articles/1/index.html"
    },
    {
        id: 2,
        title: "2.关于下载页面项目下线的公告",
        excerpt: "关于下载页面项目下线的公告",
        category: "公告",
        date: "2025-12-07",
        readTime: "1分钟阅读",
        link: "/articles/2/index.html"
    },
    {
        id: 3,
        title: "3.【Creeper的软件测评】第一集：我把三大音乐App“装”进了一个软件！免费开源神器Sollin测评",
        excerpt: "免费开源神器Sollin测评",
        category: "软件测评",
        date: "2026-01-17",
        readTime: "1分钟阅读",
        link: "/articles/3/index.html"
    },
    {
        id: 4,
        title: "4.软件测评#3——Cloudreve",
        excerpt: "免费开源神器Cloudreve测评",
        category: "软件测评",
        date: "2026-03-07",
        readTime: "12分钟阅读",
        link: "/articles/4/index.html"
    },
    {
        id: 5,
        title: "5.几何冲刺（游戏）",
        excerpt: "几何冲刺游戏规则及本体",
        category: "游戏",
        date: "2026-03-08",
        readTime: "1分钟阅读",
        link: "/articles/5/index.html"
    },
    {
        id: 6,
        title: "6.每日碳管理（工具）",
        excerpt: "每日碳管理工具介绍",
        category: "工具",
        date: "2026-03-29",
        readTime: "1分钟阅读",
        link: "/articles/6/index.html"
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
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active" data-page="${i}">${i}</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn next-btn" data-page="${currentPage + 1}">下一页 ›</button>`;
    }
    
    const startItem = (currentPage - 1) * ARTICLES_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ARTICLES_PER_PAGE, totalArticles);
    paginationHTML += `<div class="pagination-info">显示 ${startItem}-${endItem} 条，共 ${totalArticles} 条</div>`;
    
    paginationContainer.innerHTML = paginationHTML;
    
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
    
    if (currentFilter !== 'all') {
        filteredArticles = filteredArticles.filter(article => article.category === currentFilter);
    }
    
    if (currentSearch) {
        filteredArticles = filteredArticles.filter(article => 
            article.title.toLowerCase().includes(currentSearch) || 
            article.excerpt.toLowerCase().includes(currentSearch)
        );
    }
    
    currentArticles = filteredArticles;
    renderArticles(filteredArticles, page);
}

// 分享功能 - 优化移动端体验
function shareArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    
    const shareUrl = window.location.origin + article.link;
    const shareData = {
        title: article.title,
        text: article.excerpt,
        url: shareUrl
    };
    
    // 如果浏览器支持原生分享，使用原生分享（安卓/iOS均支持）
    if (navigator.share) {
        navigator.share(shareData)
            .catch(err => {
                console.warn('分享失败:', err);
                // 如果用户取消分享，不提示；如果是其他错误，提供备选方案
                if (err.name !== 'AbortError') {
                    fallbackCopyLink(shareUrl);
                }
            });
    } else {
        // 不支持原生分享时，提供复制链接的备选方案
        fallbackCopyLink(shareUrl);
    }
}

// 复制链接到剪贴板的备选方案
function fallbackCopyLink(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => {
                alert('链接已复制，可分享给好友！');
            })
            .catch(() => {
                // 降级到传统复制方法
                copyByTextarea(url);
            });
    } else {
        copyByTextarea(url);
    }
}

// 传统复制方法（兼容旧浏览器）
function copyByTextarea(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        const success = document.execCommand('copy');
        if (success) {
            alert('链接已复制，可分享给好友！');
        } else {
            alert('复制失败，请手动复制链接：' + text);
        }
    } catch (e) {
        alert('复制失败，请手动复制链接：' + text);
    }
    document.body.removeChild(textarea);
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    renderArticles(articles, 1);
    
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            currentFilter = this.getAttribute('data-filter');
            applyFiltersAndSearch(1);
        });
    });

    document.getElementById('search').addEventListener('input', function() {
        currentSearch = this.value.toLowerCase();
        applyFiltersAndSearch(1);
    });
});