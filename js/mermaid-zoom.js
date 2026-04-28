document.addEventListener('DOMContentLoaded', () => {
  const initMermaidZoom = () => {
    document.querySelectorAll('.mermaid:not([data-zoom-init])').forEach(container => {
      const svg = container.querySelector('svg');
      if (svg && svg.clientWidth > 0) {
        container.setAttribute('data-zoom-init', 'true');
        
        // 修正缩放原点，避免放大时偏移
        svg.style.transformOrigin = '0 0';
        
        // 初始化 panzoom
        panzoom(svg, {
          contain: 'outside',      // 限制拖拽边界
          startScale: 1,           // 初始缩放比例
          minScale: 0.5,           // 最小缩放
          maxScale: 3.5,           // 最大缩放
          increment: 0.1,          // 滚轮步进
          smoothScroll: true,      // 平滑滚动
          canvasPadding: 100       // 边缘留白
        });

        // 鼠标交互提示
        container.style.cursor = 'grab';
        container.addEventListener('mousedown', () => container.style.cursor = 'grabbing');
        container.addEventListener('mouseup', () => container.style.cursor = 'grab');
      }
    });
  };

  // 立即执行一次
  initMermaidZoom();

  // 监听 DOM 变化（兼容懒加载或异步渲染的 Mermaid）
  const observer = new MutationObserver(initMermaidZoom);
  observer.observe(document.body, { childList: true, subtree: true });
});