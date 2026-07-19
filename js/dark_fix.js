(function() {
  // 1. 检查用户是否在 localStorage 里存了深色模式
  const isDark = localStorage.getItem('theme') === 'dark';
  // 2. 如果没存，则检查系统是否处于深色模式
  const prefersDark = !localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches;
  // 3. 满足任一条件，立刻给 html 标签加上类名
  if (isDark || prefersDark) {
    document.documentElement.classList.add('dark-mode');
  }
})();
