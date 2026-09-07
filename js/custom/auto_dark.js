(function () {
  const START_HOUR = 19; // 晚上 19:00 开始护眼/夜间
  const END_HOUR = 7;    // 早上 07:00 结束护眼/夜间

  // 1. 判断当前系统时间是否处于夜间/护眼时间段
  function isNightTime() {
    const hour = new Date().getHours();
    return hour >= START_HOUR || hour < END_HOUR;
  }

  // 2. 检查并清理上一个轮回的手动设置记录
  function cleanExpiredUserChoice() {
    const lastSetTime = btf.saveToLocal.get('theme_set_time');
    if (lastSetTime) {
      const now = new Date().getTime();
      const hoursPassed = (now - lastSetTime) / (1000 * 60 * 60);
      // 如果手动操作时间超过 10 小时（即到了下一个白天/黑夜轮回），清除手动记录
      if (hoursPassed > 10) {
        localStorage.removeItem('theme');
        localStorage.removeItem('theme_set_time');
      }
    }
  }

  // 3. 核心切换与恢复逻辑
  function checkAndApplyTheme() {
    if (typeof btf === 'undefined') return;

    // 先检查手动记录是否已过期（跨周期重置）
    cleanExpiredUserChoice();

    const shouldBeDark = isNightTime();
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const userChoice = btf.saveToLocal.get('theme');

    // 只有在【用户当前周期内未手动干预】时，才按时间自动接管
    if (!userChoice) {
      if (shouldBeDark && currentTheme !== 'dark') {
        // 到了晚上，自动开启夜间/护眼模式
        typeof switchNightMode === 'function' ? switchNightMode() : btf.activateDarkMode();
      } else if (!shouldBeDark && currentTheme === 'dark') {
        // 到了白天，自动关闭夜间/护眼模式，恢复白天模式
        typeof switchNightMode === 'function' ? switchNightMode() : btf.activateLightMode();
      }
    }
  }

  // 4. 监听手动切换动作，记录操作时间
  window.addEventListener('click', (e) => {
    if (e.target.closest('#darkmode_button') || e.target.closest('#modeicon') || e.target.closest('.darkmode_main')) {
      btf.saveToLocal.set('theme_set_time', new Date().getTime(), 2);
    }
  });

  // 5. 页面加载完成时执行，并开启轮询检测
  window.addEventListener('load', () => {
    checkAndApplyTheme();
    // 每 60 秒检查一次（保证到了 07:00 自动切回白天，到了 19:00 自动切回夜间）
    setInterval(checkAndApplyTheme, 60000);
  });
})();