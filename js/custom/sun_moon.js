function switchNightMode() {
  // 1. 插入 Cuteen 切换动画元素
  const body = document.body;
  body.insertAdjacentHTML('beforeend', '<div class="Cuteen_DarkSky"><div class="Cuteen_DarkPlanet"></div></div>');

  // 动画淡出与清理逻辑
  setTimeout(() => {
    const darkSky = document.getElementsByClassName('Cuteen_DarkSky')[0];
    if (darkSky) {
      darkSky.style.transition = 'opacity 1s'; // 调整过度流畅度
      darkSky.style.opacity = '0';
      setTimeout(() => darkSky.remove(), 1000);
    }
  }, 1000);

  // 2. 判断当前 Butterfly 主题模式并切换
  const nowMode = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const modeIcon = document.getElementById('modeicon');

  if (nowMode === 'light') {
    // 切换到黑夜模式
    btf.activateDarkMode();
    btf.saveToLocal.set('theme', 'dark', 2);
    if (modeIcon) modeIcon.setAttribute('xlink:href', '#icon-sun');
    if (typeof GLOBAL_CONFIG !== 'undefined' && GLOBAL_CONFIG.Snackbar) {
      btf.snackbarShow(GLOBAL_CONFIG.Snackbar.day_to_night);
    }
  } else {
    // 切换到白天模式
    btf.activateLightMode();
    btf.saveToLocal.set('theme', 'light', 2);
    if (modeIcon) modeIcon.setAttribute('xlink:href', '#icon-moon');
  }

  // 3. 处理评论组件适配
  typeof utterancesTheme === 'function' && utterancesTheme();
  typeof FB === 'object' && window.loadFBComment();
  if (window.DISQUS && document.getElementById('disqus_thread')?.children.length) {
    setTimeout(() => window.disqusReset(), 200);
  }
}