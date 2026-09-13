(function () {
  const START_HOUR = 19; // 19:00 开始护眼/夜间
  const END_HOUR = 7;    // 07:00 结束护眼/夜间

  /**
   * 1. 获取当前系统时间属于哪个“模式周期”
   * @returns {Object} { isNight: boolean, periodKey: string }
   */
  function getCurrentPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hour = now.getHours();

    const isNight = hour >= START_HOUR || hour < END_HOUR;
    
    // 生成当期的唯一标识，例如 "2026-9-10-night" 或 "2026-9-10-day"
    // 注意：跨深夜（00:00 - 06:59）时，属于前一天晚上开始的 night 周期
    let periodDate = `${year}-${month}-${date}`;
    if (hour < END_HOUR) {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      periodDate = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
    }

    const periodKey = `${periodDate}-${isNight ? 'night' : 'day'}`;
    return { isNight, periodKey };
  }

  /**
   * 2. 检查并应用主题模式
   */
  function checkAndApplyTheme() {
    if (typeof btf === 'undefined') return;

    const { isNight, periodKey } = getCurrentPeriod();
    const lastUserPeriod = localStorage.getItem('theme_user_period');
    const currentTheme = document.documentElement.getAttribute('data-theme');

    // 如果用户在“当前时间段”内有过手动设置，刷新页面时保持用户手动设置的状态，不强行覆盖
    if (lastUserPeriod === periodKey) {
      return;
    }

    // 进入新时间段或用户未干预，清理历史干预标记
    if (lastUserPeriod && lastUserPeriod !== periodKey) {
      localStorage.removeItem('theme_user_period');
      localStorage.removeItem('theme'); // 清除 btf 遗留的主题标记，防止干扰
    }

    // 核心自动切换逻辑：刷新页面时触发此处判定并切换
    if (isNight && currentTheme !== 'dark') {
      // 到了夜间，自动切换为夜间/护眼模式
      typeof switchNightMode === 'function' ? switchNightMode() : btf.activateDarkMode();
    } else if (!isNight && currentTheme === 'dark') {
      // 到了白天，自动切换为白天模式
      typeof switchNightMode === 'function' ? switchNightMode() : btf.activateLightMode();
    }
  }

  /**
   * 3. 监听用户手动点击切换动作
   */
  window.addEventListener('click', (e) => {
    if (e.target.closest('#darkmode_button') || e.target.closest('#modeicon') || e.target.closest('.darkmode_main')) {
      const { periodKey } = getCurrentPeriod();
      // 记录用户在当前时间段内手动做了修改
      localStorage.setItem('theme_user_period', periodKey);
    }
  });

  /**
   * 4. 页面刷新/加载时立即执行，并开启后台定时轮询
   */
  // 方案 A：DOM 树准备好就立即执行（比 load 触发更快，防止刷新页面闪烁）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndApplyTheme);
  } else {
    checkAndApplyTheme(); // 如果脚本加载时 DOM 已就绪，直接执行
  }

  // 方案 B：挂载定时器，每 60 秒定期检查（处理页面不刷新、一直打开的情况）
  setInterval(checkAndApplyTheme, 60000);
})();