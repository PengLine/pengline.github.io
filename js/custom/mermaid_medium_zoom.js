document.addEventListener('DOMContentLoaded', function () {
  // 核心函数：将 Mermaid 的 SVG 转换为 IMG 标签
  const convertMermaidToImg = () => {
	const mermaidDivs = document.querySelectorAll('.mermaid');
	mermaidDivs.forEach(div => {
	  // 防止重复转换
	  if (div.dataset.converted) return;

	  const svg = div.querySelector('svg');
	  if (svg) {
		// 1. 将 SVG 序列化为字符串
		const svgData = new XMLSerializer().serializeToString(svg);
		// 2. 转换为 Data URL (比 base64 更稳定，不会乱码)
		const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

		// 3. 创建 <img> 标签
		const img = document.createElement('img');
		img.src = svgUrl;
		img.alt = 'Mermaid Chart';
		img.style.cssText = 'max-width: 100%; height: auto; display: block; margin: 0 auto; cursor: zoom-in;';

		// 4. 关键：给 img 添加 Butterfly 主题 Fancybox 所需的属性
		img.setAttribute('data-fancybox', 'mermaid-gallery');
		
		// 5. 替换原有的 SVG
		div.innerHTML = '';
		div.appendChild(img);

		div.dataset.converted = 'true';
	  }
	});
  };

  // 延迟执行，确保 Mermaid 已经渲染出 SVG
  setTimeout(convertMermaidToImg, 800);

  // 兼容 Pjax 页面切换（单页跳转后重新执行）
  document.addEventListener('pjax:complete', () => setTimeout(convertMermaidToImg, 800));
});