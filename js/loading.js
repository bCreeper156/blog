// ========================================
// 加载进度条 - 全局统一实现（真实进度）
// ---------------------------------------------------------------
// 百分比完全来自页面真实外部资源的加载完成情况：
//   1. 扫描页面中所有外部资源元素
//      (script / link / img / video / audio / iframe / source / track / embed / object)；
//   2. 通过元素的 load / error 事件 + Resource Timing API 判断每个资源
//      是否「真正加载结束」（含加载失败，失败也算结束）；
//   3. 百分比 = 已完成资源数 / 已发现的资源总数；
//   4. 只有在 window 的 load 事件触发（即所有资源确确实实加载完毕）后，
//      进度才会到达 100%。
// 全程不使用任何定时器假进度、随机进度或 readyState 硬编码百分比。
//
// 样式：css/common.css 与 articles/article.css 中的 #gh-loader* 规则。
// 引入：在页面 <head> 中引入本脚本（非 defer，保证尽早开始统计）。
// 适用：除 /app 目录、/articles/6/app.html、/articles/5/game.html、
//      /articles/6/shuju.html 之外的所有页面。
// ========================================
(function () {
    'use strict';

    if (window.__ghProgressBarInit) return;
    window.__ghProgressBarInit = true;

    // 需要统计的外部资源（排除 preconnect / dns-prefetch 等不产生请求的 link）
    var RESOURCE_SELECTOR = [
        'script[src]',
        'link[rel="stylesheet"][href]',
        'link[rel="icon"][href]',
        'link[rel="apple-touch-icon"][href]',
        'link[rel="manifest"][href]',
        'link[rel="preload"][href]',
        'link[rel="modulepreload"][href]',
        'img[src]',
        'img[srcset]',
        'video[src]',
        'video[poster]',
        'audio[src]',
        'iframe[src]',
        'source[src]',
        'source[srcset]',
        'track[src]',
        'embed[src]',
        'object[data]'
    ].join(',');

    // ---------------- 进度条 DOM ----------------
    // 复用页面里已静态存在的节点（如 index.html），否则自动创建
    var wrap = document.getElementById('gh-loader-wrap');
    var bar = document.getElementById('gh-loader');
    var tip = document.getElementById('gh-loader-tip');

    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'gh-loader-wrap';
    }
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'gh-loader';
    }
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'gh-loader-tip';
    }

    // 脚本在 <head> 中执行时 body 可能还不存在，先挂到 <html>，DOM 就绪后再修正
    function mount() {
        var parent = document.body || document.documentElement;
        if (bar.parentNode !== wrap) wrap.appendChild(bar);
        if (wrap.parentNode !== parent) parent.appendChild(wrap);
        if (tip.parentNode !== parent) parent.appendChild(tip);
    }
    mount();

    // 有些页面（如 index.html）在 body 中静态提供了 #gh-loader* 节点。
    // 由于本脚本早于 body 解析时执行，会自建节点，这里清理后出现的重复节点，保留先出现的那一份。
    function dedupe(id) {
        var nodes = document.querySelectorAll('[id="' + id + '"]');
        for (var i = 1; i < nodes.length; i++) {
            if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
        }
    }

    // ---------------- 状态 ----------------
    var tracked = [];                       // [{ url, done }]
    var seen = [];                          // 已扫描过的元素
    var perfLoaded = Object.create(null);   // Resource Timing 中确认完成的 URL
    var current = 0;                        // 当前显示百分比
    var target = 0;                         // 目标百分比
    var animRaf = null;
    var measureRaf = null;
    var hideTimer = null;
    var finished = false;                   // window.load 之后置为 true

    function absolute(url) {
        if (!url) return '';
        try {
            return new URL(url, document.baseURI).href;
        } catch (e) {
            return '';
        }
    }

    function urlOf(el) {
        switch (el.tagName) {
            case 'IMG': return el.currentSrc || el.src || '';
            case 'LINK': return el.href || '';
            case 'OBJECT': return el.data || '';
            default: return el.src || el.href || '';
        }
    }

    function refreshPerf() {
        if (!window.performance || typeof performance.getEntriesByType !== 'function') return;
        var entries = performance.getEntriesByType('resource');
        for (var i = 0; i < entries.length; i++) {
            perfLoaded[entries[i].name] = true;
        }
    }

    function trackElement(el) {
        if (seen.indexOf(el) !== -1) return;
        seen.push(el);

        var url = absolute(urlOf(el));
        if (!url) return;

        var rec = { url: url, done: false };

        // 已经加载结束：Resource Timing 有记录，或图片已 complete
        if (perfLoaded[url] || (el.tagName === 'IMG' && el.complete)) {
            rec.done = true;
        } else {
            el.addEventListener('load', function () {
                if (!rec.done) { rec.done = true; schedule(); }
            }, { once: true });
            el.addEventListener('error', function () {
                if (!rec.done) { rec.done = true; schedule(); }
            }, { once: true });
        }

        tracked.push(rec);
    }

    function scan() {
        var nodes = document.querySelectorAll(RESOURCE_SELECTOR);
        for (var i = 0; i < nodes.length; i++) {
            trackElement(nodes[i]);
        }
    }

    function schedule() {
        if (finished || measureRaf) return;
        measureRaf = requestAnimationFrame(function () {
            measureRaf = null;
            step();
        });
    }

    function step() {
        if (finished) return;

        scan();
        refreshPerf();

        // Resource Timing 可能晚于元素事件，这里补齐
        for (var i = 0; i < tracked.length; i++) {
            if (!tracked[i].done && perfLoaded[tracked[i].url]) {
                tracked[i].done = true;
            }
        }

        var total = tracked.length;
        var done = 0;
        for (var j = 0; j < total; j++) {
            if (tracked[j].done) done++;
        }

        // 真实比例；load 之前最高 99%，100% 只由 window.load 触发
        var ratio = total ? (done / total) : 0;
        setTarget(Math.min(99, ratio * 100));
    }

    function setTarget(value) {
        target = Math.max(0, Math.min(100, value));
        startAnim();
    }

    // ---------------- 渲染 / 动画 ----------------
    function render() {
        var pct = Math.round(current);
        bar.style.width = pct + '%';

        if (current >= 100) {
            tip.textContent = '加载完成 100%';
            return;
        }
        tip.textContent = '加载中 ' + pct + '%';
        wrap.classList.remove('hide');
        tip.classList.add('show');
    }

    function tick() {
        var diff = target - current;
        if (Math.abs(diff) < 0.4) {
            current = target;
            render();
            animRaf = null;
            if (current >= 100) hideSoon();
            return;
        }
        current += diff * 0.18;
        render();
        animRaf = requestAnimationFrame(tick);
    }

    function startAnim() {
        if (animRaf) return;
        animRaf = requestAnimationFrame(tick);
    }

    function hideSoon() {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(function () {
            wrap.classList.add('hide');
            tip.classList.remove('show');
        }, 320);
    }

    // window.load：所有资源（含图片等）真正加载完毕，此时才是真实的 100%
    function complete() {
        if (finished) return;
        finished = true;

        refreshPerf();
        for (var i = 0; i < tracked.length; i++) {
            tracked[i].done = true;
        }
        target = 100;
        startAnim();
    }

    // ---------------- 观察器 ----------------
    function observe() {
        if (window.MutationObserver) {
            var mo = new MutationObserver(function () { schedule(); });
            mo.observe(document.documentElement, { childList: true, subtree: true });
        }
        if (window.PerformanceObserver) {
            try {
                var po = new PerformanceObserver(function () { schedule(); });
                po.observe({ entryTypes: ['resource'] });
            } catch (e) { /* 浏览器不支持则忽略，元素事件仍可兜底 */ }
        }
    }

    // ---------------- 启动 ----------------
    function boot() {
        observe();
        refreshPerf();
        scan();
        setTarget(0);
        schedule();
    }

    boot();

    if (document.readyState === 'complete') {
        complete();
    } else {
        window.addEventListener('load', complete);
    }

    document.addEventListener('DOMContentLoaded', function () {
        dedupe('gh-loader-wrap');
        dedupe('gh-loader');
        dedupe('gh-loader-tip');
        mount();
        schedule();
    });

    // 从 bfcache 恢复：页面已缓存，无需再加载，直接呈现完成态
    window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;
        finished = true;
        if (measureRaf) {
            cancelAnimationFrame(measureRaf);
            measureRaf = null;
        }
        current = 100;
        target = 100;
        render();
        hideSoon();
    });
})();
