
document.addEventListener('DOMContentLoaded', function() {
  // 创建全屏查看的 DOM 结构
  const createModal = () => {
	const overlay = document.createElement('div');
	overlay.id = 'mermaid-modal-overlay';
	overlay.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center; cursor:zoom-out;';
	
	const modalContent = document.createElement('div');
	modalContent.id = 'mermaid-modal-content';
	modalContent.style.cssText = 'max-width:90%; max-height:90%; overflow:auto; background:#fff; padding:20px; border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.5);';
	
	overlay.appendChild(modalContent);
	document.body.appendChild(overlay);

	// 点击遮罩层关闭
	overlay.addEventListener('click', () => {
	  overlay.style.display = 'none';
	});
  };

  // 绑定点击事件
  const bindClick = () => {
	if (!document.getElementById('mermaid-modal-overlay')) createModal();
	
	const mermaidDivs = document.querySelectorAll('.mermaid');
	mermaidDivs.forEach(div => {
	  if (!div.dataset.zoomBound) {
		div.style.cursor = 'zoom-in'; // 鼠标变成小手
		div.addEventListener('click', function() {
		  const svg = this.querySelector('svg');
		  if (svg) {
			const modalContent = document.getElementById('mermaid-modal-content');
			modalContent.innerHTML = '';
			// 克隆 SVG 放入模态框
			const clonedSvg = svg.cloneNode(true);
			clonedSvg.style.maxWidth = '100%';
			clonedSvg.style.height = 'auto';
			modalContent.appendChild(clonedSvg);
			document.getElementById('mermaid-modal-overlay').style.display = 'flex';
		  }
		});
		div.dataset.zoomBound = 'true';
	  }
	});
  };

  // 初始绑定
  setTimeout(bindClick, 500);
  
  // 监听 Pjax 页面切换
  document.addEventListener('pjax:complete', () => setTimeout(bindClick, 500));
});