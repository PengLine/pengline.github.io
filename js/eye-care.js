// ==============
// Butterfly 护眼模式同步脚本
// ==============

(function() {
  'use strict';

  // 应用护眼样式到当前页面
  function applyTheme(theme) {
    if (theme === 'dark') {
      // 启用护眼模式
      document.body.classList.add('eye-care-enabled');
    } else {
      // 禁用护眼模式
      document.body.classList.remove('eye-care-enabled');
    }
  }

  // 监听 Butterfly 主题变化
  function initThemeSync() {
    // 获取当前主题
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(currentTheme);

    // 监听主题变化（使用 MutationObserver）
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') || 'light';
          applyTheme(newTheme);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSync);
  } else {
    initThemeSync();
  }
})();