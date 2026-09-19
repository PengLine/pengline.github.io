(function () {
  'use strict';

  // =========================
  // 配置
  // =========================
  const START_HOUR = 19; // 19:00 开始夜间模式
  const END_HOUR = 7;    // 07:00 开始白天模式

  const USER_PERIOD_KEY = 'theme_user_period';
  const THEME_KEY = 'theme';

  let timer = null;

  // =========================
  // 安全 localStorage
  // =========================
  function getStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function removeStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // 忽略 storage 异常
    }
  }

  function setStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // 忽略 storage 异常
    }
  }

  // =========================
  // 获取当前时间周期
  // =========================
  function getCurrentPeriod() {
    const now = new Date();
    const hour = now.getHours();

    const isNight = hour >= START_HOUR || hour < END_HOUR;

    // 00:00 ~ 06:59 仍属于“前一天的夜间周期”
    const periodDate = new Date(now);

    if (hour < END_HOUR) {
      periodDate.setDate(periodDate.getDate() - 1);
    }

    const periodKey =
      `${periodDate.getFullYear()}-` +
      `${periodDate.getMonth() + 1}-` +
      `${periodDate.getDate()}-` +
      `${isNight ? 'night' : 'day'}`;

    return {
      isNight,
      periodKey,
      now
    };
  }

  // =========================
  // 获取当前主题
  // =========================
  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme');
  }

  // =========================
  // 切换主题
  // =========================
  function applyTheme(isNight) {
    if (typeof btf === 'undefined') {
      return;
    }

    const currentTheme = getCurrentTheme();

    if (isNight) {
      if (currentTheme === 'dark') {
        return;
      }

      if (typeof switchNightMode === 'function') {
        switchNightMode();
      } else if (typeof btf.activateDarkMode === 'function') {
        btf.activateDarkMode();
      }

    } else {
      if (currentTheme !== 'dark') {
        return;
      }

      if (typeof switchNightMode === 'function') {
        switchNightMode();
      } else if (typeof btf.activateLightMode === 'function') {
        btf.activateLightMode();
      }
    }
  }

  // =========================
  // 检查并应用主题
  // =========================
  function checkAndApplyTheme() {
    if (typeof btf === 'undefined') {
      return;
    }

    const {
      isNight,
      periodKey
    } = getCurrentPeriod();

    const lastUserPeriod = getStorage(USER_PERIOD_KEY);

    // 用户已经在当前周期手动切换过
    // 本周期内不再自动干预
    if (lastUserPeriod === periodKey) {
      return;
    }

    // 进入新的时间周期
    // 清除上一周期的用户干预状态
    if (lastUserPeriod && lastUserPeriod !== periodKey) {
      removeStorage(USER_PERIOD_KEY);

      // 清除 Butterfly 可能保存的旧主题状态
      removeStorage(THEME_KEY);
    }

    // 自动应用主题
    applyTheme(isNight);
  }

  // =========================
  // 监听用户手动切换
  // =========================
  function handleUserThemeClick(event) {
    const target = event.target;

    if (
      !target.closest('#darkmode_button') &&
      !target.closest('#modeicon') &&
      !target.closest('.darkmode_main')
    ) {
      return;
    }

    const { periodKey } = getCurrentPeriod();

    // 标记：
    // 用户已经在当前时间周期内主动操作过主题
    setStorage(USER_PERIOD_KEY, periodKey);
  }

  // =========================
  // 计算下一次自动切换时间
  // =========================
  function getNextSwitchTime() {
    const now = new Date();
    const next = new Date(now);

    const hour = now.getHours();

    if (hour >= START_HOUR) {
      // 今天 19:00
      next.setHours(START_HOUR, 0, 0, 0);

      // 如果已经过了 19:00，则等待明天 19:00
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

    } else if (hour < END_HOUR) {
      // 今天 07:00
      next.setHours(END_HOUR, 0, 0, 0);

      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

    } else {
      // 白天阶段，下一次切换是今天 19:00
      next.setHours(START_HOUR, 0, 0, 0);
    }

    return next;
  }

  // =========================
  // 安排下一次检查
  // =========================
  function scheduleNextCheck() {
    if (timer) {
      clearTimeout(timer);
    }

    const next = getNextSwitchTime();
    const delay = Math.max(next.getTime() - Date.now(), 1000);

    timer = setTimeout(function () {
      checkAndApplyTheme();
      scheduleNextCheck();
    }, delay);
  }

  // =========================
  // 初始化
  // =========================
  function init() {
    checkAndApplyTheme();
    scheduleNextCheck();
  }

  // =========================
  // 事件
  // =========================
  window.addEventListener('click', handleUserThemeClick);

  // 页面首次加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

})();
