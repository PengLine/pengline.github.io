function switchNightMode() {
	// 1. 获取目标模式
	const isCurrentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
	const targetMode = isCurrentlyDark ? 'light' : 'dark';

	// 2. 清理历史动画 DOM
	document.querySelectorAll('.Cuteen_DarkSky').forEach(el => el.remove());

	// 3. 构建日月交替 DOM
	let planetsHTML = '';
	let skyClass = 'Cuteen_DarkSky';

	if (targetMode === 'dark') {
		// 切黑夜：天空变暗 + 右落太阳 + 左升【立体半月】
		skyClass = 'Cuteen_DarkSky is-dark';
		planetsHTML = `
      <div class="planet-sun anim-drop-right"></div>
      <div class="planet-moon anim-rise-left"></div>
    `;
	} else {
		// 切白天：天空变亮 + 右落【立体半月】 + 左升太阳
		planetsHTML = `
      <div class="planet-moon anim-drop-right"></div>
      <div class="planet-sun anim-rise-left"></div>
    `;
	}

	const animHTML = `<div class="${skyClass}">${planetsHTML}</div>`;
	document.body.insertAdjacentHTML('beforeend', animHTML);

	// 4. 淡出与清理 (1.5秒动画结束后平滑淡出)
	setTimeout(() => {
		const darkSky = document.querySelector('.Cuteen_DarkSky');
		if (darkSky) {
			darkSky.style.transition = 'opacity 0.8s ease';
			darkSky.style.opacity = '0';
			setTimeout(() => darkSky.remove(), 800);
		}
	}, 1500);

	// 5. 执行 Butterfly 主题切换与导航栏图标更新
	const modeIcon = document.getElementById('modeicon');
	const setIcon = (iconId) => {
		if (!modeIcon) return;
		modeIcon.setAttribute('href', iconId);
		modeIcon.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', iconId);
	};

	if (targetMode === 'dark') {
		btf.activateDarkMode();
		btf.saveToLocal.set('theme', 'dark', 2);
		setIcon('#icon-moon');
		if (typeof GLOBAL_CONFIG !== 'undefined' && GLOBAL_CONFIG.Snackbar) {
			btf.snackbarShow(GLOBAL_CONFIG.Snackbar.day_to_night);
		}
	} else {
		btf.activateLightMode();
		btf.saveToLocal.set('theme', 'light', 2);
		setIcon('#icon-sun');
		if (typeof GLOBAL_CONFIG !== 'undefined' && GLOBAL_CONFIG.Snackbar) {
			btf.snackbarShow(GLOBAL_CONFIG.Snackbar.night_to_day);
		}
	}

	// 6. 评论组件适配
	typeof utterancesTheme === 'function' && utterancesTheme();
	typeof FB === 'object' && window.loadFBComment();
	if (window.DISQUS && document.getElementById('disqus_thread')?.children.length) {
		setTimeout(() => window.disqusReset(), 200);
	}

}