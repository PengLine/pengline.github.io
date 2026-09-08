document.addEventListener('DOMContentLoaded', function () {
  // 1. 创建全屏查看的 DOM 结构
  const createViewer = () => {
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
      transition: transform 0.1s ease-out; 
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
  };

  const closeViewer = () => {
    const overlay = document.getElementById('mermaid-viewer-overlay');
    const container = document.getElementById('mermaid-viewer-container');
    if (overlay && container) {
      overlay.style.display = 'none';
      container.style.transform = 'translate(0px, 0px) scale(1)';
      container.innerHTML = '';
    }
  };

  // 2. 核心交互逻辑
  const initInteractions = () => {
    const overlay = document.getElementById('mermaid-viewer-overlay');
    const container = document.getElementById('mermaid-viewer-container');

    let scale = 1;
    let posX = 0, posY = 0;
    let isDragging = false;
    let startX, startY;

    const updateTransform = () => {
      container.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    };

    overlay.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.min(Math.max(0.3, scale + delta), 5);
      updateTransform();
    }, { passive: false });

    overlay.addEventListener('mousedown', (e) => {
      if (e.target.id === 'mermaid-viewer-close' || e.target.closest('#mermaid-viewer-close')) return;
      e.preventDefault();
      isDragging = true;
      startX = e.clientX - posX;
      startY = e.clientY - posY;
      overlay.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      posX = e.clientX - startX;
      posY = e.clientY - startY;
      updateTransform();
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        overlay.style.cursor = 'grab';
      }
    });

    overlay.addEventListener('dblclick', (e) => {
      if (e.target.id === 'mermaid-viewer-close' || e.target.closest('#mermaid-viewer-close')) return;
      scale = 1;
      posX = 0;
      posY = 0;
      updateTransform();
    });

    let touchStartX = 0, touchStartY = 0;
    let lastTouchDist = 0;

    overlay.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartX = touch.clientX - posX;
        touchStartY = touch.clientY - posY;
        isDragging = true;
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      }
    }, { passive: true });

    overlay.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        const touch = e.touches[0];
        posX = touch.clientX - touchStartX;
        posY = touch.clientY - touchStartY;
        updateTransform();
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        if (lastTouchDist > 0) {
          const delta = (dist - lastTouchDist) / 100;
          scale = Math.min(Math.max(0.3, scale + delta), 5);
          updateTransform();
        }
        lastTouchDist = dist;
      }
    }, { passive: false });

    overlay.addEventListener('touchend', () => {
      isDragging = false;
      lastTouchDist = 0;
    }, { passive: true });
  };

  // 3. 获取 SVG 尺寸
  const getSvgSize = (svg) => {
    let viewBox = svg.getAttribute('viewBox');
    let width = svg.getAttribute('width');
    let height = svg.getAttribute('height');

    if (viewBox) {
      const parts = viewBox.split(' ').map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        return { width: parts[2], height: parts[3] };
      }
    }

    if (width && height) {
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

  // 4. 绑定点击事件
  const bindClick = () => {
    if (!document.getElementById('mermaid-viewer-overlay')) {
      createViewer();
      initInteractions();
    }

    document.querySelectorAll('.mermaid').forEach(div => {
      if (!div.dataset.viewerBound) {
        div.style.cursor = 'zoom-in';
        div.addEventListener('click', function (e) {
          e.stopPropagation();
          if (this.closest('#mermaid-viewer-container')) return;

          const svg = this.querySelector('svg');
          if (!svg) return;

          const container = document.getElementById('mermaid-viewer-container');
          container.innerHTML = '';

          const clonedSvg = svg.cloneNode(true);

          // 获取原始尺寸
          const svgSize = getSvgSize(clonedSvg);

          // 计算可用视口尺寸（留出边距）
          const padding = 20;
          const maxWidth = window.innerWidth - padding * 2 - 20; // 额外留出关闭按钮空间
          const maxHeight = window.innerHeight - padding * 2 - 80; // 顶部留出关闭按钮空间

          // 【核心修复】分别计算宽高比例，取较小值确保完整显示
          const scaleX = maxWidth / svgSize.width;
          const scaleY = maxHeight / svgSize.height;
          const fitScale = Math.min(scaleX, scaleY, 2); // 最大放大到2倍

          // 计算实际显示尺寸
          let displayWidth = svgSize.width * fitScale;
          let displayHeight = svgSize.height * fitScale;

          // 【关键修复】如果图片是竖图（高>宽），限制高度，让宽度自然适应
          if (svgSize.height > svgSize.width) {
            // 竖图：以高度为基准
            displayHeight = Math.min(maxHeight, svgSize.height * 1.2);
            displayWidth = displayHeight * (svgSize.width / svgSize.height);
          } else {
            // 横图或方图：以宽度为基准
            displayWidth = Math.min(maxWidth, svgSize.width * 1.2);
            displayHeight = displayWidth * (svgSize.height / svgSize.width);
          }

          // 再次确保不超过最大尺寸
          if (displayWidth > maxWidth) {
            displayWidth = maxWidth;
            displayHeight = displayWidth * (svgSize.height / svgSize.width);
          }
          if (displayHeight > maxHeight) {
            displayHeight = maxHeight;
            displayWidth = displayHeight * (svgSize.width / svgSize.height);
          }

          // 创建 wrapper - 使用内容自适应
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

          // 【修复】SVG 使用精确的像素尺寸，而不是百分比
          clonedSvg.style.cssText = `
            display: block;
            width: ${displayWidth}px;
            height: ${displayHeight}px;
            flex-shrink: 0;
          `;

          // 确保 viewBox 存在
          if (!clonedSvg.getAttribute('viewBox')) {
            clonedSvg.setAttribute('viewBox', `0 0 ${svgSize.width} ${svgSize.height}`);
          }
          clonedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

          // 移除可能冲突的属性
          clonedSvg.removeAttribute('width');
          clonedSvg.removeAttribute('height');

          // 修复文字颜色
          const allTexts = clonedSvg.querySelectorAll('text');
          allTexts.forEach(text => {
            const fill = text.getAttribute('fill');
            if (fill && ['white', '#fff', '#ffffff', 'rgb(255,255,255)'].includes(fill.toLowerCase())) {
              text.setAttribute('fill', '#333333');
            }
            if (!fill || fill === 'none') {
              text.setAttribute('fill', '#333333');
            }
          });

          // 修复节点背景
          const allNodes = clonedSvg.querySelectorAll('.node > rect, .cluster > rect, .label > rect');
          allNodes.forEach(rect => {
            const fill = rect.getAttribute('fill');
            if (!fill || ['white', '#fff', '#ffffff', 'transparent', 'none'].includes(fill.toLowerCase())) {
              rect.setAttribute('fill', '#f5f7fa');
            }
          });

          wrapper.appendChild(clonedSvg);
          container.appendChild(wrapper);

          // 重置变换
          container.style.transform = 'translate(0px, 0px) scale(1)';

          // 重置状态
          if (window._mermaidViewerState) {
            window._mermaidViewerState.scale = 1;
            window._mermaidViewerState.posX = 0;
            window._mermaidViewerState.posY = 0;
          }

          const overlay = document.getElementById('mermaid-viewer-overlay');
          overlay.style.display = 'flex';
        });
        div.dataset.viewerBound = 'true';
      }
    });
  };

  window._mermaidViewerState = {
    scale: 1,
    posX: 0,
    posY: 0
  };

  setTimeout(bindClick, 1000);
  document.addEventListener('pjax:complete', () => setTimeout(bindClick, 1000));

  const observer = new MutationObserver(() => {
    setTimeout(bindClick, 500);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});