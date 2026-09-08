document.addEventListener('DOMContentLoaded', function () {
  const state = {
    scale: 1,
    posX: 0,
    posY: 0,
    isDragging: false,
    startX: 0,
    startY: 0
  };

  // 1. 创建全屏查看的 DOM 结构
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

    closeBtn.onmouseover = () => {
      closeBtn.style.transform = 'scale(1.2) rotate(90deg)';
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
      container.style.transform = 'translate(0px, 0px) scale(1)';
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

  // 2. 交互逻辑
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

  // 3. 安全获取 SVG 尺寸
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

  // 4. 精准匹配 .mermaid-wrap 与各种 mermaid SVG
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

      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        display: inline-block;
        background: #ffffff;
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
      `;

      if (!clonedSvg.getAttribute('viewBox')) {
        clonedSvg.setAttribute('viewBox', `0 0 ${svgSize.width} ${svgSize.height}`);
      }
      clonedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      clonedSvg.removeAttribute('width');
      clonedSvg.removeAttribute('height');

      clonedSvg.querySelectorAll('text').forEach(text => {
        const fill = text.getAttribute('fill');
        if (!fill || fill === 'none' || ['white', '#fff', '#ffffff', 'rgb(255,255,255)'].includes(fill.toLowerCase())) {
          text.setAttribute('fill', '#333333');
        }
      });

      clonedSvg.querySelectorAll('.node > rect, .cluster > rect, .label > rect').forEach(rect => {
        const fill = rect.getAttribute('fill');
        if (!fill || ['white', '#fff', '#ffffff', 'transparent', 'none'].includes(fill.toLowerCase())) {
          rect.setAttribute('fill', '#f5f7fa');
        }
      });

      wrapper.appendChild(clonedSvg);
      container.appendChild(wrapper);

      resetTransform();

      const overlay = document.getElementById('mermaid-viewer-overlay');
      overlay.style.display = 'flex';
    }
  });

  // 为所有 mermaid-wrap 和 SVG 自动注入鼠标手型图标 CSS
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

  createViewer();
  addHoverStyle();
});