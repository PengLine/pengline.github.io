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

    // 右上角退出按钮
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

    // 点击背景关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeViewer();
    });

    // ESC 键关闭
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

  // 2. 核心交互逻辑：滚轮缩放 + 鼠标拖拽
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

    // 滚轮缩放
    overlay.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.min(Math.max(0.3, scale + delta), 5);
      updateTransform();
    }, { passive: false });

    // 鼠标拖拽
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

    // 双击重置
    overlay.addEventListener('dblclick', (e) => {
      if (e.target.id === 'mermaid-viewer-close' || e.target.closest('#mermaid-viewer-close')) return;
      scale = 1;
      posX = 0;
      posY = 0;
      updateTransform();
    });

    // 触摸支持（移动端）
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

  // 3. 绑定点击事件
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

          // 克隆 SVG
          const clonedSvg = svg.cloneNode(true);

          // 获取原始 SVG 的 viewBox 或尺寸
          let viewBox = clonedSvg.getAttribute('viewBox');
          let width = clonedSvg.getAttribute('width');
          let height = clonedSvg.getAttribute('height');

          // 如果没有 viewBox，根据宽高创建
          if (!viewBox && width && height) {
            viewBox = `0 0 ${parseFloat(width)} ${parseFloat(height)}`;
          }

          // 构建包装器 - 使用自适应尺寸
          const wrapper = document.createElement('div');
          wrapper.style.cssText = `
            width: 90vw;
            max-width: 1200px;
            height: 85vh;
            max-height: 900px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            padding: 30px;
            box-sizing: border-box;
            position: relative;
            overflow: auto;
          `;

          // SVG 容器
          const svgWrapper = document.createElement('div');
          svgWrapper.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          `;

          // 设置 SVG 样式
          clonedSvg.style.cssText = `
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
          `;

          // 确保 viewBox 正确
          if (viewBox) {
            clonedSvg.setAttribute('viewBox', viewBox);
          }
          clonedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

          // 【重要】移除可能存在的固定宽高，让 SVG 自适应
          clonedSvg.removeAttribute('width');
          clonedSvg.removeAttribute('height');

          // 【修复文字颜色】确保所有文字在白色背景下可见
          // 遍历所有 text 元素，确保颜色正确
          const allTexts = clonedSvg.querySelectorAll('text');
          allTexts.forEach(text => {
            // 如果文本颜色是黑色或深色，保持不变
            // 如果颜色是白色或浅色，改为深色
            const fill = text.getAttribute('fill');
            if (fill && ['white', '#fff', '#ffffff', 'rgb(255,255,255)'].includes(fill.toLowerCase())) {
              text.setAttribute('fill', '#333333');
            }
            // 确保没有 fill 的 text 有默认颜色
            if (!fill) {
              text.setAttribute('fill', '#333333');
            }
          });

          // 修复节点的背景色（如果是浅色背景上的浅色节点）
          const allNodes = clonedSvg.querySelectorAll('.node, .cluster, .label');
          allNodes.forEach(node => {
            const rect = node.querySelector('rect');
            if (rect) {
              const fill = rect.getAttribute('fill');
              // 如果矩形填充是白色或透明，设置一个柔和的颜色
              if (!fill || ['white', '#fff', '#ffffff', 'transparent', 'none'].includes(fill.toLowerCase())) {
                rect.setAttribute('fill', '#f0f4ff');
              }
            }
          });

          svgWrapper.appendChild(clonedSvg);
          wrapper.appendChild(svgWrapper);
          container.appendChild(wrapper);

          // 重置变换
          container.style.transform = 'translate(0px, 0px) scale(1)';

          // 重置缩放和位置变量
          if (window._mermaidViewerState) {
            window._mermaidViewerState.scale = 1;
            window._mermaidViewerState.posX = 0;
            window._mermaidViewerState.posY = 0;
          }

          // 显示 overlay
          const overlay = document.getElementById('mermaid-viewer-overlay');
          overlay.style.display = 'flex';
        });
        div.dataset.viewerBound = 'true';
      }
    });
  };

  // 初始化状态存储
  window._mermaidViewerState = {
    scale: 1,
    posX: 0,
    posY: 0
  };

  // 延迟执行确保 Mermaid 已渲染
  setTimeout(bindClick, 1000);

  // 支持 PJAX/动态内容
  document.addEventListener('pjax:complete', () => setTimeout(bindClick, 1000));

  // 支持 MutationObserver 监听动态添加的 Mermaid 图表
  const observer = new MutationObserver(() => {
    setTimeout(bindClick, 500);
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});