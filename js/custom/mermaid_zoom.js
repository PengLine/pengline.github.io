document.addEventListener('DOMContentLoaded', function () {
  const state = {
    scale: 1,
    posX: 0,
    posY: 0,
    isDragging: false,
    startX: 0,
    startY: 0
  };

  // 1. 获取当前页面是否处于暗黑/护眼模式
  const checkDarkMode = () => {
    return (
      document.documentElement.getAttribute('data-theme') === 'dark' || 
      document.body.classList.contains('dark') || 
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  };

  // 2. 在切换主题时，重新渲染页面上的 Mermaid 图表（无需手动刷新）
  const reRenderMermaid = () => {
    if (!window.mermaid) return;

    const isDarkMode = checkDarkMode();
    
    // 初始化 Mermaid 配置
    mermaid.initialize({
      startOnLoad: false,
      theme: isDarkMode ? 'dark' : 'default',
      securityLevel: 'loose'
    });

    // 寻找页面上所有的 Mermaid 容器
    const mermaidNodes = document.querySelectorAll('.mermaid, .mermaid-wrap, [class*="mermaid"]');
    
    mermaidNodes.forEach((node, index) => {
      // 获取原始 Mermaid 代码（如果被清理过，从 dataset 或原始文本中读取）
      let code = node.dataset.originalCode;
      if (!code) {
        // 首次保存原始代码，避免重绘时代码丢失
        code = node.innerText || node.textContent;
        node.dataset.originalCode = code;
      }

      if (!code || code.trim() === '') return;

      // 清空节点现有的 SVG 内容
      node.removeAttribute('data-processed');
      node.innerHTML = code;

      // 重新渲染生成原生 SVG
      try {
        const id = `mermaid-dynamic-${Date.now()}-${index}`;
        mermaid.render(id, code).then(result => {
          node.innerHTML = result.svg;
        }).catch(() => {
          // 兼容旧版本 Mermaid 的同步 render 方式
          if (mermaid.init) {
            mermaid.init(undefined, node);
          }
        });
      } catch (err) {
        if (mermaid.init) {
          mermaid.init(undefined, node);
        }
      }
    });
  };

  // 3. 监听 HTML 标签的 data-theme 属性变化，自动触发重绘
  const observeThemeChange = () => {
    const targetNode = document.documentElement;
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && (mutation.attributeName === 'data-theme' || mutation.attributeName === 'class')) {
          reRenderMermaid();
        }
      }
    });
    observer.observe(targetNode, { attributes: true });
  };

  // 4. 创建全屏查看的 DOM 结构
  const createViewer = () => {
    if (document.getElementById('mermaid-viewer-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'mermaid-viewer-overlay';
    overlay.style.cssText = `
      display: none; 
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100%; 
      height: 100%; 
      background: rgba(0,0,0,0.85); 
      z-index: 99999; 
      justify-content: center; 
      align-items: center; 
      overflow: hidden; 
      cursor: grab; 
      user-select: none;
    `;

    const container = document.createElement('div');
    container.id = 'mermaid-viewer-container';
    container.style.cssText = `
      transition: transform 0.05s ease-out; 
      transform-origin: center center; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      width: 100%; 
      height: 100%;
    `;

    const closeBtn = document.createElement('div');
    closeBtn.id = 'mermaid-viewer-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      position: fixed; 
      top: 20px; 
      right: 30px; 
      font-size: 45px; 
      color: white; 
      cursor: pointer; 
      z-index: 100000; 
      line-height: 1; 
      transition: transform 0.2s; 
      text-shadow: 0 2px 5px rgba(0,0,0,0.5);
      font-family: Arial, sans-serif;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(5px);
    `;

	// 放大的倍数 1.0 表示100%展示，1.2表示放大
    closeBtn.onmouseover = () => {
      closeBtn.style.transform = 'scale(1.1) rotate(90deg)';
      closeBtn.style.background = 'rgba(255,255,255,0.2)';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.transform = 'scale(1) rotate(0deg)';
      closeBtn.style.background = 'rgba(255,255,255,0.1)';
    };
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeViewer();
    };

    overlay.appendChild(container);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeViewer();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.style.display === 'flex') closeViewer();
    });

    initInteractions(overlay, container);
  };

  const resetTransform = () => {
    state.scale = 1;
    state.posX = 0;
    state.posY = 0;
    const container = document.getElementById('mermaid-viewer-container');
    if (container) {
      container.style.transform = 'translate(0px, 0px) scale(1.2)';
    }
  };

  const closeViewer = () => {
    const overlay = document.getElementById('mermaid-viewer-overlay');
    const container = document.getElementById('mermaid-viewer-container');
    if (overlay && container) {
      overlay.style.display = 'none';
      resetTransform();
      container.innerHTML = '';
    }
  };

  // 5. 交互逻辑
  const initInteractions = (overlay, container) => {
    const updateTransform = () => {
      container.style.transform = `translate(${state.posX}px, ${state.posY}px) scale(${state.scale})`;
    };

    overlay.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      state.scale = Math.min(Math.max(0.3, state.scale + delta), 5);
      updateTransform();
    }, { passive: false });

    overlay.addEventListener('mousedown', (e) => {
      if (e.target.id === 'mermaid-viewer-close' || e.target.closest('#mermaid-viewer-close')) return;
      e.preventDefault();
      state.isDragging = true;
      state.startX = e.clientX - state.posX;
      state.startY = e.clientY - state.posY;
      overlay.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!state.isDragging) return;
      state.posX = e.clientX - state.startX;
      state.posY = e.clientY - state.startY;
      updateTransform();
    });

    document.addEventListener('mouseup', () => {
      if (state.isDragging) {
        state.isDragging = false;
        overlay.style.cursor = 'grab';
      }
    });

    overlay.addEventListener('dblclick', (e) => {
      if (e.target.id === 'mermaid-viewer-close' || e.target.closest('#mermaid-viewer-close')) return;
      resetTransform();
    });

    let touchStartX = 0, touchStartY = 0;
    let lastTouchDist = 0;

    overlay.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartX = touch.clientX - state.posX;
        touchStartY = touch.clientY - state.posY;
        state.isDragging = true;
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      }
    }, { passive: true });

    overlay.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && state.isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        state.posX = touch.clientX - touchStartX;
        state.posY = touch.clientY - touchStartY;
        updateTransform();
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        if (lastTouchDist > 0) {
          const delta = (dist - lastTouchDist) / 100;
          state.scale = Math.min(Math.max(0.3, state.scale + delta), 5);
          updateTransform();
        }
        lastTouchDist = dist;
      }
    }, { passive: false });

    overlay.addEventListener('touchend', () => {
      state.isDragging = false;
      lastTouchDist = 0;
    }, { passive: true });
  };

  // 6. 安全获取 SVG 尺寸
  const getSvgSize = (svg) => {
    let viewBox = svg.getAttribute('viewBox');
    let width = svg.getAttribute('width');
    let height = svg.getAttribute('height');

    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        return { width: parts[2], height: parts[3] };
      }
    }

    if (width && height && !width.includes('%') && !height.includes('%')) {
      return {
        width: parseFloat(width),
        height: parseFloat(height)
      };
    }

    try {
      const bbox = svg.getBBox?.();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        return { width: bbox.width, height: bbox.height };
      }
    } catch (e) { }

    return { width: 800, height: 600 };
  };

  // 7. 点击放大处理
  document.addEventListener('click', function (e) {
    const targetDiv = e.target.closest('.mermaid-wrap, .mermaid, [class*="mermaid"]');
    const svg = e.target.closest('svg');

    const isMermaid = targetDiv || (svg && (svg.id.includes('mermaid') || svg.classList.contains('mermaid')));

    if (isMermaid && !e.target.closest('#mermaid-viewer-container')) {
      const currentSvg = svg || targetDiv.querySelector('svg');
      if (!currentSvg) return;

      e.stopPropagation();

      const container = document.getElementById('mermaid-viewer-container');
      container.innerHTML = '';

      const clonedSvg = currentSvg.cloneNode(true);
      const svgSize = getSvgSize(clonedSvg);

      const padding = 20;
      const maxWidth = window.innerWidth - padding * 2 - 20;
      const maxHeight = window.innerHeight - padding * 2 - 80;

      const scaleX = maxWidth / svgSize.width;
      const scaleY = maxHeight / svgSize.height;
      const fitScale = Math.min(scaleX, scaleY, 2);

      let displayWidth = svgSize.width * fitScale;
      let displayHeight = svgSize.height * fitScale;

      if (svgSize.height > svgSize.width) {
        displayHeight = Math.min(maxHeight, svgSize.height * 1.2);
        displayWidth = displayHeight * (svgSize.width / svgSize.height);
      } else {
        displayWidth = Math.min(maxWidth, svgSize.width * 1.2);
        displayHeight = displayWidth * (svgSize.height / svgSize.width);
      }

      if (displayWidth > maxWidth) {
        displayWidth = maxWidth;
        displayHeight = displayWidth * (svgSize.height / svgSize.width);
      }
      if (displayHeight > maxHeight) {
        displayHeight = maxHeight;
        displayWidth = displayHeight * (svgSize.width / svgSize.height);
      }

      const isDarkMode = checkDarkMode();

      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        display: inline-block;
        background: ${isDarkMode ? '#1e1e1e' : '#ffffff'};
        ${isDarkMode ? 'border: 1px solid #333333;' : ''}
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        padding: 15px;
        box-sizing: border-box;
        line-height: 0;
      `;

      clonedSvg.style.cssText = `
        display: block;
        width: ${displayWidth}px;
        height: ${displayHeight}px;
        flex-shrink: 0;
        background: transparent;
      `;

      if (!clonedSvg.getAttribute('viewBox')) {
        clonedSvg.setAttribute('viewBox', `0 0 ${svgSize.width} ${svgSize.height}`);
      }
      clonedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      clonedSvg.removeAttribute('width');
      clonedSvg.removeAttribute('height');

      wrapper.appendChild(clonedSvg);
      container.appendChild(wrapper);

      resetTransform();

      const overlay = document.getElementById('mermaid-viewer-overlay');
      overlay.style.display = 'flex';
    }
  });

  // 8. 注入悬浮手型样式
  const addHoverStyle = () => {
    if (document.getElementById('mermaid-hover-style')) return;
    const style = document.createElement('style');
    style.id = 'mermaid-hover-style';
    style.innerHTML = `
      .mermaid-wrap, .mermaid, [class*="mermaid"], svg[id*="mermaid"] {
        cursor: zoom-in !important;
      }
      .mermaid-wrap svg, .mermaid svg {
        cursor: zoom-in !important;
      }
    `;
    document.head.appendChild(style);
  };

  // 初始化执行
  createViewer();
  addHoverStyle();
  observeThemeChange();

  // 记录初始源码，防止第一次获取失败
  document.querySelectorAll('.mermaid, .mermaid-wrap, [class*="mermaid"]').forEach((node) => {
    if (!node.dataset.originalCode) {
      node.dataset.originalCode = node.innerText || node.textContent;
    }
  });
});