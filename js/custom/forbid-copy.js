document.oncontextmenu = function() {
	return false; // 禁用右键菜单
};
document.onselectstart = function() {
	return false; // 禁用文本选择
};
document.oncopy = function(event) {
	event.preventDefault(); // 阻止复制事件
	alert('对不起，禁止复制！'); // 提示用户
};

// 禁用右键菜单
document.addEventListener('contextmenu', e => e.preventDefault());

// 禁用 Ctrl+C / Ctrl+X / Ctrl+V
document.addEventListener('keydown', e => {
  if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || 
                    e.key === 'x' || e.key === 'X' || 
                    e.key === 'v' || e.key === 'V')) {
    e.preventDefault();
    // 可选：提示用户
    // alert('复制功能已禁用');
  }
});

// 禁用拖拽选择
document.addEventListener('dragstart', e => e.preventDefault());