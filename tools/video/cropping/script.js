// 视频裁剪工具 JavaScript

// 全局变量
let videoContainer;
let videoElement;
let cropSelection;
let cropXInput, cropYInput, cropWidthInput, cropHeightInput;
let startTimeInput, endTimeInput, totalDurationElement;
let videoUpload, outputVideo, downloadBtn, applyCropBtn;
let progressBar, progressBarContainer, progressPercentage;
let isDragging = false;
let isResizing = false;
let lastX, lastY;
let currentHandle;
let videoRect;
let videoWidthRatio = 1;
let videoHeightRatio = 1;
let videoRatio = 1; // 保留用于向后兼容
let currentVideoFile = null;
let enableDragCropCheckbox;
let previewSection, settingsSection, outputSection;

// 文档加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    try {
        // 获取DOM元素
        videoElement = document.getElementById('videoPlayer');
        videoContainer = videoElement.parentElement;
        cropSelection = document.getElementById('cropSelection');
        cropXInput = document.getElementById('cropX');
        cropYInput = document.getElementById('cropY');
        cropWidthInput = document.getElementById('cropWidth');
        cropHeightInput = document.getElementById('cropHeight');
        startTimeInput = document.getElementById('startTime');
        endTimeInput = document.getElementById('endTime');
        totalDurationElement = document.getElementById('totalDuration');
        videoUpload = document.getElementById('videoUpload');
        outputVideo = document.getElementById('outputVideo');
        downloadBtn = document.getElementById('downloadBtn');
        applyCropBtn = document.getElementById('applyCropBtn');
        
        // 特别确保进度条元素正确获取
        console.log('初始化进度条元素');
        progressBarContainer = document.getElementById('progress-container');
        console.log('进度条容器:', progressBarContainer);
        
        progressBar = document.getElementById('progressBar');
        console.log('进度条:', progressBar);
        
        progressPercentage = document.getElementById('progressPercentage');
        console.log('进度百分比:', progressPercentage);
        
        // 初始化时确保进度条隐藏
        if (progressBarContainer) {
            progressBarContainer.style.display = 'none';
        }
        
        enableDragCropCheckbox = document.getElementById('enableDragCrop');
        previewSection = document.getElementById('previewSection');
        settingsSection = document.getElementById('settingsSection');
        outputSection = document.getElementById('outputSection');
        
        // 初始化
        initializeCropBox();
        setupDragDropEvents();
        setupVideoUpload();
        setupCropFunctionality();
        
        // 初始更新视频容器信息
        updateVideoContainerRect();
        
        // 初始隐藏设置和结果部分，只有上传视频后才显示
        hideVideoSections();
    } catch (error) {
            console.error('初始化时出错:', error);
            showToast('页面初始化过程中出现错误，请刷新页面重试。');
        }
});

// 像素对齐辅助函数
function alignToPixel(value) {
    return Math.round(value);
}

// 更新视频容器位置信息
function updateVideoContainerRect() {
    // 确保videoContainer存在
    if (!videoContainer || !videoElement) {
        videoWidthRatio = 1;
        videoHeightRatio = 1;
        videoRatio = 1;
        return;
    }
    
    try {
        // 获取视频容器的显示尺寸
        videoRect = videoContainer.getBoundingClientRect();
        
        // 计算宽高比例
        if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0 && videoElement.offsetWidth > 0 && videoElement.offsetHeight > 0) {
            // 视频元素实际显示尺寸 / 视频实际尺寸 = 缩放比例
            videoWidthRatio = videoElement.offsetWidth / videoElement.videoWidth;
            videoHeightRatio = videoElement.offsetHeight / videoElement.videoHeight;
            videoRatio = videoWidthRatio; // 保留用于向后兼容
        } else {
            videoWidthRatio = 1;
            videoHeightRatio = 1;
            videoRatio = 1;
        }
    } catch (error) {
        // 错误处理，确保比例值始终有效
        videoWidthRatio = 1;
        videoHeightRatio = 1;
        videoRatio = 1;
        console.warn('更新视频容器信息时出错:', error);
    }
}

// 更新裁剪框选择
function updateCropBoxSelection() {
    try {
        // 获取视频实际尺寸和显示尺寸
        const videoWidth = videoElement.videoWidth || 1000;
        const videoHeight = videoElement.videoHeight || 1000;
        const videoDisplayWidth = videoElement.offsetWidth || 1000;
        const videoDisplayHeight = videoElement.offsetHeight || 1000;
        
        // 计算视频实际尺寸和显示尺寸之间的比例
        const displayToActualWidthRatio = videoWidth / videoDisplayWidth;
        const displayToActualHeightRatio = videoHeight / videoDisplayHeight;
        const actualToDisplayWidthRatio = videoDisplayWidth / videoWidth;
        const actualToDisplayHeightRatio = videoDisplayHeight / videoHeight;
        
        // 获取输入框的值，这些值是相对于视频实际尺寸的坐标
        let x = parseFloat(cropXInput.value) || 0;
        let y = parseFloat(cropYInput.value) || 0;
        let width = parseFloat(cropWidthInput.value) || 0;
        let height = parseFloat(cropHeightInput.value) || 0;
        
        // 保存原始用户输入值
        const originalX = x;
        const originalY = y;
        const originalWidth = width;
        const originalHeight = height;
        
        // 参数约束规则：值不能超过视频实际尺寸大小，不能小于一定值
        // 只在值明显超出范围时才进行调整，允许用户自由输入接近范围的值
        let needsUpdate = false;
        
        // 检查X坐标
        if (x < 0) {
            x = 0;
            needsUpdate = true;
        } else if (x > videoWidth - width) {
            x = Math.max(0, videoWidth - width);
            needsUpdate = true;
        }
        
        // 检查Y坐标
        if (y < 0) {
            y = 0;
            needsUpdate = true;
        } else if (y > videoHeight - height) {
            y = Math.max(0, videoHeight - height);
            needsUpdate = true;
        }
        
        // 检查宽度
        if (width < 100) {
            width = 100;
            needsUpdate = true;
        } else if (width > videoWidth - x) {
            width = Math.min(videoWidth, videoWidth - x);
            needsUpdate = true;
        }
        
        // 检查高度
        if (height < 100) {
            height = 100;
            needsUpdate = true;
        } else if (height > videoHeight - y) {
            height = Math.min(videoHeight, videoHeight - y);
            needsUpdate = true;
        }
        
        // 确保最终值完全符合约束（仅在需要更新时）
        if (needsUpdate) {
            // 确保最大尺寸不超过视频尺寸
            width = Math.min(videoWidth, width);
            height = Math.min(videoHeight, height);
            x = Math.min(videoWidth - width, x);
            y = Math.min(videoHeight - height, y);
            
            // 更新输入框的值
            cropXInput.value = alignToPixel(x);
            cropYInput.value = alignToPixel(y);
            cropWidthInput.value = alignToPixel(width);
            cropHeightInput.value = alignToPixel(height);
        }
        
        // 获取视频元素在容器中的偏移量
        const videoRect = videoElement.getBoundingClientRect();
        const containerRect = videoContainer.getBoundingClientRect();
        const videoOffsetX = Math.round(videoRect.left - containerRect.left);
        const videoOffsetY = Math.round(videoRect.top - containerRect.top);
        
        // 将相对于视频实际尺寸的坐标转换为相对于显示尺寸的坐标
        const displayX = x * actualToDisplayWidthRatio;
        const displayY = y * actualToDisplayHeightRatio;
        const displayWidth = width * actualToDisplayWidthRatio;
        const displayHeight = height * actualToDisplayHeightRatio;
        
        console.log('更新裁剪框 - 实际坐标:', x, y, width, height);
        console.log('更新裁剪框 - 显示坐标:', displayX, displayY, displayWidth, displayHeight);
        console.log('视频偏移量:', videoOffsetX, videoOffsetY);
        
        // 计算裁剪框在容器中的实际位置（相对于视频左上角的显示坐标 + 视频在容器中的偏移量）
        const actualLeft = Math.round(displayX + videoOffsetX);
        const actualTop = Math.round(displayY + videoOffsetY);
        
        // 更新裁剪框样式
        cropSelection.style.left = actualLeft + 'px';
        cropSelection.style.top = actualTop + 'px';
        cropSelection.style.width = Math.round(displayWidth) + 'px';
        cropSelection.style.height = Math.round(displayHeight) + 'px';
        
        console.log('裁剪框实际位置:', actualLeft, actualTop);
    } catch (error) {
        console.error('更新裁剪框选择时出错:', error);
    }
}

// 同步输入值到裁剪框
function syncInputValuesToCrop(x, y, width, height) {
    // 计算实际坐标值（乘以比例）
    cropXInput.value = alignToPixel(x * videoWidthRatio);
    cropYInput.value = alignToPixel(y * videoHeightRatio);
    cropWidthInput.value = alignToPixel(width * videoWidthRatio);
    cropHeightInput.value = alignToPixel(height * videoHeightRatio);
}

// 隐藏视频相关部分（预览、设置、结果）
function hideVideoSections() {
    if (previewSection) previewSection.style.display = 'none';
    if (settingsSection) settingsSection.style.display = 'none';
    if (outputSection) outputSection.style.display = 'none';
    // 禁用裁剪按钮
    if (applyCropBtn) applyCropBtn.disabled = true;
}

// 显示视频相关部分
function showVideoSections() {
    if (previewSection) previewSection.style.display = 'block';
    if (settingsSection) settingsSection.style.display = 'block';
    // 恢复按钮状态
    resetCropButtonState();
}

// 恢复裁剪按钮状态
function resetCropButtonState() {
    // 恢复按钮文本和禁用状态
    if (applyCropBtn) {
        applyCropBtn.disabled = false;
        applyCropBtn.textContent = '开始执行裁剪';
    }
    
    // 隐藏进度条
    if (progressBarContainer) progressBarContainer.style.display = 'none';
    
    // 清理全局进度更新函数
    if (window.updateProgress) {
        delete window.updateProgress;
    }
}

// 创建Toast提示元素
function createToastElement() {
    const toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s, transform 0.3s;
        max-width: 300px;
        word-wrap: break-word;
    `;
    document.body.appendChild(toast);
    return toast;
}

// 显示Toast提示
function showToast(message, duration = 2000) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = createToastElement();
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    // 自动隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
    }, duration);
}

// 设置初始裁剪框位置
function setupInitialCropBox() {
    console.log('开始设置初始裁剪框');
    
    // 确保更新最新的视频容器信息
    updateVideoContainerRect();
    
    try {
        // 只检查容器是否存在，不再依赖视频原始尺寸
        if (videoContainer) {
            // 强制重新获取视频容器和视频元素的实际显示尺寸
            const containerRect = videoContainer.getBoundingClientRect();
            const videoRect = videoElement.getBoundingClientRect();
            
            // 计算视频元素相对于容器的偏移量
            const videoOffsetX = videoRect.left - containerRect.left;
            const videoOffsetY = videoRect.top - containerRect.top;
            
            // 获取视频元素的实际显示尺寸
            const videoDisplayWidth = videoElement.offsetWidth;
            const videoDisplayHeight = videoElement.offsetHeight;
            
            console.log('视频原始尺寸:', videoElement?.videoWidth || 'N/A', 'x', videoElement?.videoHeight || 'N/A');
            console.log('视频显示尺寸:', videoDisplayWidth, 'x', videoDisplayHeight);
            console.log('容器显示尺寸:', containerRect.width, 'x', containerRect.height);
            console.log('视频元素相对于容器的偏移:', videoOffsetX, 'x', videoOffsetY);
            console.log('计算的视频比例:', videoWidthRatio, videoHeightRatio);
            
            // 确保容器尺寸有效
            if (containerRect.width <= 0 || containerRect.height <= 0) {
                console.warn('容器尺寸无效，将使用默认值');
                // 使用默认值
                cropXInput.value = '0';
                cropYInput.value = '0';
                cropWidthInput.value = '320';
                cropHeightInput.value = '240';
            } else {
                // 关键修改：输入框应该存储视频的实际尺寸坐标，而不是显示尺寸
                const initialX = 0; // 输入框使用相对视频左上角的坐标（实际尺寸）
                const initialY = 0; // 输入框使用相对视频左上角的坐标（实际尺寸）
                
                // 获取视频的实际尺寸
                const videoActualWidth = videoElement?.videoWidth || 320;
                const videoActualHeight = videoElement?.videoHeight || 240;
                
                console.log('设置裁剪框尺寸:', videoActualWidth, 'x', videoActualHeight, 'at', initialX, ',', initialY);
                
                // 直接设置输入框的值（使用相对于视频左上角的实际尺寸坐标）
                cropXInput.value = alignToPixel(initialX);
                cropYInput.value = alignToPixel(initialY);
                cropWidthInput.value = alignToPixel(videoActualWidth);
                cropHeightInput.value = alignToPixel(videoActualHeight);
            }
            
            // 立即更新裁剪框显示
            updateCropBoxSelection();
            
            // 确保裁剪框可见
            cropSelection.classList.add('active');
            console.log('裁剪框设置完成');
        }
    } catch (error) {
        console.warn('设置初始裁剪框位置时出错:', error);
    }
}

// 初始化裁剪框
function initializeCropBox() {
    // 设置默认值，确保不小于最小尺寸100x100
    cropXInput.value = '0';
    cropYInput.value = '0';
    cropWidthInput.value = '100';
    cropHeightInput.value = '100';
    
    // 清空现有控制点
    cropSelection.innerHTML = '';
    
    // 创建拖动控制点
    const handles = [
        { position: 'top-left', className: 'top-left' },
        { position: 'top-right', className: 'top-right' },
        { position: 'bottom-right', className: 'bottom-right' },
        { position: 'bottom-left', className: 'bottom-left' }
        // { position: 'right', className: 'right' },
        // { position: 'bottom', className: 'bottom' }
    ];
    
    handles.forEach(handle => {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = `handle ${handle.className}`;
        resizeHandle.dataset.handle = handle.position;
        cropSelection.appendChild(resizeHandle);
    });
    
    // 移除实时输入检查，改为在失去焦点或按Enter键时检查
    // 添加失去焦点事件监听器，确保最终值符合约束规则
    cropWidthInput.addEventListener('blur', updateCropBoxSelection, { once: false });
    cropHeightInput.addEventListener('blur', updateCropBoxSelection, { once: false });
    cropXInput.addEventListener('blur', updateCropBoxSelection, { once: false });
    cropYInput.addEventListener('blur', updateCropBoxSelection, { once: false });
    
    // 添加Enter键事件监听器，按下Enter键时检查合规性
    const checkOnEnter = (event) => {
        if (event.key === 'Enter') {
            updateCropBoxSelection();
        }
    };
    
    cropWidthInput.addEventListener('keydown', checkOnEnter, { once: false });
    cropHeightInput.addEventListener('keydown', checkOnEnter, { once: false });
    cropXInput.addEventListener('keydown', checkOnEnter, { once: false });
    cropYInput.addEventListener('keydown', checkOnEnter, { once: false });
    
    // 监听视频加载
    videoElement.addEventListener('loadedmetadata', setupInitialCropBox);
    
    // 监听视频尺寸变化（当视频大小改变时）
    videoElement.addEventListener('resize', setupInitialCropBox);
    
    // 监听窗口大小变化，确保裁剪框适应视频容器变化
    window.addEventListener('resize', debounce(setupInitialCropBox, 200));
    
    // 如果视频已经加载完成
    if (videoElement.readyState >= 1) {
        setupInitialCropBox();
    }
}

// 防抖函数，避免频繁执行
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 鼠标拖动处理函数
function onMouseDragMove(e) {
    if (!isDragging || !videoElement || !videoContainer) return;
    
    try {
        e.preventDefault();
        
        // 计算鼠标移动距离（显示尺寸）
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        // 更新lastX和lastY
        lastX = e.clientX;
        lastY = e.clientY;
        
        // 更新视频容器信息
        updateVideoContainerRect();
        
        // 确保比例有效
        const safeWidthRatio = videoWidthRatio > 0 ? videoWidthRatio : 1;
        const safeHeightRatio = videoHeightRatio > 0 ? videoHeightRatio : 1;
        
        // 获取当前裁剪框参数（实际尺寸）
        let currentX = parseFloat(cropXInput.value) || 0;
        let currentY = parseFloat(cropYInput.value) || 0;
        let currentWidth = parseFloat(cropWidthInput.value) || 100;
        let currentHeight = parseFloat(cropHeightInput.value) || 100;
        
        // 获取视频实际尺寸
        const videoWidth = videoElement.videoWidth || 1000;
        const videoHeight = videoElement.videoHeight || 1000;
        
        // 使用requestAnimationFrame确保平滑更新
        requestAnimationFrame(() => {
            // 将鼠标移动距离（显示尺寸）转换为实际尺寸移动量
            const actualDeltaX = deltaX / safeWidthRatio;
            const actualDeltaY = deltaY / safeHeightRatio;
            
            // 应用移动
            let newX = currentX + actualDeltaX;
            let newY = currentY + actualDeltaY;
            
            // 边界检查（使用实际尺寸）
            newX = Math.max(0, Math.min(videoWidth - currentWidth, newX));
            newY = Math.max(0, Math.min(videoHeight - currentHeight, newY));
            
            // 更新裁剪框
            // 直接设置输入框的值（实际尺寸）
            cropXInput.value = alignToPixel(newX);
            cropYInput.value = alignToPixel(newY);
            cropWidthInput.value = alignToPixel(currentWidth);
            cropHeightInput.value = alignToPixel(currentHeight);
            
            updateCropBoxSelection();
        });
    } catch (error) {
        console.warn('拖动裁剪框时出错:', error);
    }
}

// 鼠标松开处理函数
function onMouseDragUp() {
    console.log('Mouse drag up event');
    isDragging = false;
    // 使用属性方式移除事件监听器，与添加时保持一致
    document.onmousemove = null;
    document.onmouseup = null;
}

// 调整大小处理函数
function onResizeDragMove(e) {
    if (!isResizing || !currentHandle || !videoElement || !videoContainer) return;
    
    try {
        e.preventDefault();
        
        // 获取容器和视频元素的位置信息
        const containerRect = videoContainer.getBoundingClientRect();
        const videoRect = videoElement.getBoundingClientRect();
        
        // 计算视频元素在容器内的偏移量
        const videoOffsetX = Math.round(videoRect.left - containerRect.left);
        const videoOffsetY = Math.round(videoRect.top - containerRect.top);
        
        // 计算鼠标在容器内的位置（显示坐标）
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        
        // 计算鼠标在视频元素内的相对位置（减去视频元素的偏移量）
        const relativeMouseX = mouseX - videoOffsetX;
        const relativeMouseY = mouseY - videoOffsetY;
        
        // 更新视频容器信息
        updateVideoContainerRect();
        
        // 确保比例有效
        const safeWidthRatio = videoWidthRatio > 0 ? videoWidthRatio : 1;
        const safeHeightRatio = videoHeightRatio > 0 ? videoHeightRatio : 1;
        
        // 转换为实际坐标（基于视频元素的实际尺寸）
        const realMouseX = relativeMouseX / safeWidthRatio;
        const realMouseY = relativeMouseY / safeHeightRatio;
        
        // 获取当前裁剪框参数（实际尺寸）
        let x = parseFloat(cropXInput.value) || 0;
        let y = parseFloat(cropYInput.value) || 0;
        let width = parseFloat(cropWidthInput.value) || 100;
        let height = parseFloat(cropHeightInput.value) || 100;
        
        // 最小尺寸限制（实际尺寸）
        const minSize = 100;
        
        // 获取视频实际尺寸
        const videoWidth = videoElement.videoWidth || 1000;
        const videoHeight = videoElement.videoHeight || 1000;
        
        // 使用requestAnimationFrame确保平滑更新
        requestAnimationFrame(() => {
            // 根据拖动的控制点类型处理
            switch (currentHandle) {
                case 'top-left':
                    // 左上角：同时调整位置和大小
                    const newX = Math.min(realMouseX, x + width - minSize);
                    const newY = Math.min(realMouseY, y + height - minSize);
                    width = x + width - newX;
                    height = y + height - newY;
                    x = Math.max(0, newX);
                    y = Math.max(0, newY);
                    break;
                    
                case 'top-right':
                    // 右上角：调整宽度和顶部位置
                    width = Math.max(minSize, Math.min(realMouseX - x, videoWidth - x));
                    const newTopY = Math.min(realMouseY, y + height - minSize);
                    height = y + height - newTopY;
                    y = Math.max(0, newTopY);
                    break;
                    
                case 'bottom-right':
                    // 右下角：同时调整宽度和高度
                    width = Math.max(minSize, Math.min(realMouseX - x, videoWidth - x));
                    height = Math.max(minSize, Math.min(realMouseY - y, videoHeight - y));
                    break;
                    
                case 'bottom-left':
                    // 左下角：调整左侧位置和高度
                    const newLeftX = Math.min(realMouseX, x + width - minSize);
                    width = x + width - newLeftX;
                    x = Math.max(0, newLeftX);
                    height = Math.max(minSize, Math.min(realMouseY - y, videoHeight - y));
                    break;
                    
                case 'right':
                    // 右侧：仅调整宽度
                    width = Math.max(minSize, Math.min(realMouseX - x, videoWidth - x));
                    break;
                    
                case 'bottom':
                    // 底部：仅调整高度
                    height = Math.max(minSize, Math.min(realMouseY - y, videoHeight - y));
                    break;
            }
            
            // 最终边界检查 - 确保裁剪框完全在视频范围内
            width = Math.max(minSize, Math.min(videoWidth, width));
            height = Math.max(minSize, Math.min(videoHeight, height));
            x = Math.max(0, Math.min(videoWidth - width, x));
            y = Math.max(0, Math.min(videoHeight - height, y));
            
            // 更新裁剪框
            // 直接设置输入框的值（实际尺寸）
            cropXInput.value = alignToPixel(x);
            cropYInput.value = alignToPixel(y);
            cropWidthInput.value = alignToPixel(width);
            cropHeightInput.value = alignToPixel(height);
            
            updateCropBoxSelection();
        });
    } catch (error) {
        console.warn('调整裁剪框大小时出错:', error);
    }
}

// 调整大小松开处理函数
function onResizeDragUp() {
    console.log('Resize drag up event');
    isResizing = false;
    currentHandle = null;
    // 使用属性方式移除事件监听器，与添加时保持一致
    document.onmousemove = null;
    document.onmouseup = null;
}

// 设置拖拽相关事件
function setupDragDropEvents() {
    if (!cropSelection || !videoContainer || !videoElement) {
        console.warn('无法设置拖拽事件：必要元素不存在');
        return;
    }
    
    try {
        // 为裁剪框本身添加拖动事件，确保可以拖动整个裁剪框
        cropSelection.onmousedown = function(e) {
            if (!isResizing && !e.target.classList.contains('handle')) {
                console.log('Crop selection mousedown event');
                isDragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
                
                // 使用属性方式添加事件监听器
                document.onmousemove = onMouseDragMove;
                document.onmouseup = onMouseDragUp;
            }
        };
        
        // 确保所有控制点都正确绑定事件监听器
        function bindHandleEvents() {
            // 直接在cropSelection中查找所有handle元素
            const resizeHandles = cropSelection.querySelectorAll('.handle');
            console.log('Resize handles found:', resizeHandles.length);
            
            // 为每个控制点添加事件监听器
            resizeHandles.forEach(handle => {
                // 添加明确的调试信息
                console.log('Binding events to handle:', handle.className);
                
                // 确保正确设置z-index，让控制点在最上层
                handle.style.zIndex = '1000';
                handle.style.opacity = '1'; // 确保控制点可见
                
                // 重新添加事件监听器
                handle.onmousedown = function(e) {
                    console.log('Handle mousedown event:', e.target.className);
                    e.stopPropagation();
                    e.preventDefault();
                    
                    isResizing = true;
                    // 使用dataset属性更可靠地获取控制点类型
                    currentHandle = handle.dataset.handle || handle.className.split(' ')[1];
                    console.log('Current handle set to:', currentHandle);
                    
                    // 添加全局事件监听器
                    document.onmousemove = onResizeDragMove;
                    document.onmouseup = onResizeDragUp;
                };
            });
        }
        
        // 立即绑定事件
        bindHandleEvents();
        
        // 在设置初始裁剪框后重新绑定事件，确保新创建的控制点也有事件
        const originalSetupInitialCropBox = setupInitialCropBox;
        setupInitialCropBox = function() {
            originalSetupInitialCropBox.apply(this, arguments);
            bindHandleEvents();
        };
    } catch (error) {
        console.warn('设置拖拽事件时出错:', error);
    }
}

// 导出裁剪参数
function exportCropParams() {
    const x = parseFloat(cropXInput.value);
    const y = parseFloat(cropYInput.value);
    const width = parseFloat(cropWidthInput.value);
    const height = parseFloat(cropHeightInput.value);
    
    // 直接使用输入框中的值（实际尺寸）
    const realX = Math.round(x);
    const realY = Math.round(y);
    const realWidth = Math.round(width);
    const realHeight = Math.round(height);
    
    const cropParams = {
        x: realX,
        y: realY,
        width: realWidth,
        height: realHeight
    };
    
    console.log('裁剪参数:', cropParams);
    return cropParams;
}

// 设置视频上传功能
function setupVideoUpload() {
    if (!videoUpload || !videoElement) {
        console.warn('无法设置视频上传：必要元素不存在');
        return;
    }
    
    // 获取上传按钮元素
    const uploadBtn = document.querySelector('.upload-btn');
    
    videoUpload.addEventListener('change', function(e) {
        try {
            const file = e.target.files[0];
            if (!file) return;
            
            // 验证文件类型
            if (!file.type.startsWith('video/')) {
                showModal('文件类型错误', '请上传视频文件！');
                return;
            }
            
            // 验证文件大小（100MB = 100 * 1024 * 1024字节）
            const maxSize = 100 * 1024 * 1024;
            if (file.size > maxSize) {
                showModal('文件过大', '视频文件大小不能超过100MB，请选择更小的视频文件！');
                return;
            }
            
            // 上传开始：置灰按钮并显示"上传中..."
            if (uploadBtn) {
                uploadBtn.style.opacity = '0.6';
                uploadBtn.style.cursor = 'not-allowed';
                uploadBtn.textContent = '上传中...';
            }
            
            // 存储当前文件
            currentVideoFile = file;
            
            // 显示视频信息：名称和大小（MB）
            const videoInfo = document.getElementById('videoInfo');
            if (videoInfo) {
                const videoSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                videoInfo.innerHTML = `<p><strong>名称：</strong>${file.name}</p><p><strong>大小：</strong>${videoSizeMB} MB</p>`;
            }
            
            // 创建视频URL
            const videoURL = URL.createObjectURL(file);
            
            // 清理之前可能存在的视频
            if (videoElement.src) {
                try {
                    URL.revokeObjectURL(videoElement.src);
                } catch (e) {
                    console.warn('清理旧URL时出错:', e);
                }
            }
            
            // 设置视频源
            videoElement.src = videoURL;
            
            // 监听视频元数据加载事件
            videoElement.onloadedmetadata = function() {
                try {
                    // 显示视频总时长
                    const duration = videoElement.duration;
                    totalDurationElement.textContent = formatTime(duration);
                    
                    // 设置时间输入框的约束
                    startTimeInput.min = '0';
                    startTimeInput.max = (duration - 0.1).toFixed(1);
                    endTimeInput.min = '0.1';
                    endTimeInput.max = duration.toFixed(1);
                    
                    // 设置默认时间范围
                    startTimeInput.value = '0';
                    endTimeInput.value = duration.toFixed(1);
                    
                    // 添加时间输入框的实时约束事件
                    startTimeInput.addEventListener('input', updateTimeInputConstraints);
                    endTimeInput.addEventListener('input', updateTimeInputConstraints);
                    
                    // 重置输出视频
                    outputVideo.src = '';
                    
                    // 显示视频相关部分
                    showVideoSections();
                    
                    // 等待一点时间后设置裁剪框，确保容器尺寸已更新
                    setTimeout(setupInitialCropBox, 100);
                    
                    // 上传完成：恢复按钮状态
                    if (uploadBtn) {
                        uploadBtn.style.opacity = '1';
                        uploadBtn.style.cursor = 'pointer';
                        uploadBtn.textContent = '上传视频文件';
                    }
                } catch (error) {
                    console.error('视频元数据加载时出错:', error);
                    showModal('加载失败', '视频信息加载失败，请重试。');
                    
                    // 上传失败：恢复按钮状态
                    if (uploadBtn) {
                        uploadBtn.style.opacity = '1';
                        uploadBtn.style.cursor = 'pointer';
                        uploadBtn.textContent = '上传视频文件';
                    }
                }
            };
            
            // 监听视频数据加载完成事件，此时视频实际尺寸已经确定
            videoElement.onloadeddata = function() {
                try {
                    // 再次设置裁剪框，确保与实际渲染的视频尺寸匹配
                    setTimeout(function() {
                        setupInitialCropBox();
                        updateSizeInputConstraints();
                    }, 200);
                    
                    // 添加尺寸输入框的实时约束事件
                    cropXInput.addEventListener('input', updateSizeInputConstraints);
                    cropYInput.addEventListener('input', updateSizeInputConstraints);
                    cropWidthInput.addEventListener('input', updateSizeInputConstraints);
                    cropHeightInput.addEventListener('input', updateSizeInputConstraints);
                } catch (error) {
                    console.error('视频数据加载完成时设置裁剪框出错:', error);
                }
            };
            
            // 监听视频尺寸变化（当视频大小改变时）
            videoElement.onresize = function() {
                try {
                    setupInitialCropBox();
                } catch (error) {
                    console.error('视频尺寸变化时设置裁剪框出错:', error);
                }
            };
            
            // 处理视频加载错误
            videoElement.onerror = function() {
                console.error('视频加载错误');
                showToast('视频加载失败，请检查文件是否损坏。');
                currentVideoFile = null;
                // 隐藏视频相关部分
                hideVideoSections();
                
                // 上传失败：恢复按钮状态
                if (uploadBtn) {
                    uploadBtn.style.opacity = '1';
                    uploadBtn.style.cursor = 'pointer';
                    uploadBtn.textContent = '上传视频文件';
                }
            };
            
        } catch (error) {
            console.error('处理视频上传时出错:', error);
            showToast('视频上传处理过程中出现错误，请重试。');
            currentVideoFile = null;
            
            // 上传失败：恢复按钮状态
            if (uploadBtn) {
                uploadBtn.style.opacity = '1';
                uploadBtn.style.cursor = 'pointer';
                uploadBtn.textContent = '上传视频文件';
            }
        }
    });
}

// 设置裁剪功能
function setupCropFunctionality() {
    if (!applyCropBtn || !downloadBtn) {
        console.warn('无法设置裁剪功能：必要元素不存在');
        return;
    }
    
    // 裁剪按钮事件
    applyCropBtn.addEventListener('click', applyCrop);
    
    // 下载按钮事件
    downloadBtn.addEventListener('click', downloadVideo);
    
    // 启用/禁用手动画框裁剪
    if (enableDragCropCheckbox) {
        enableDragCropCheckbox.addEventListener('change', function() {
            if (this.checked) {
                cropSelection.classList.remove('disabled');
            } else {
                cropSelection.classList.add('disabled');
            }
        });
    }
}

// 应用裁剪
// 进度条相关变量

// 应用裁剪函数修改
function applyCrop() {
    if (!currentVideoFile || !videoElement) {
        showToast('请先上传视频文件！');
        return;
    }
    
    try {
        // 更新按钮文本为"裁剪中"
        if (applyCropBtn) {
            applyCropBtn.disabled = true;
            applyCropBtn.textContent = '视频裁剪中，不要刷新页面...';
        }
        
        // 显示进度条
        if (progressBarContainer) {
            progressBarContainer.style.display = 'block';
            // 重置进度条
            if (progressBar) progressBar.style.width = '0%';
            if (progressPercentage) progressPercentage.textContent = '0%';
        }
        
        showToast('正在处理视频，请稍候...');
        
        // 获取裁剪参数
        const cropParams = exportCropParams();
        let startTime = parseFloat(startTimeInput.value) || 0;
        let endTime = parseFloat(endTimeInput.value) || videoElement.duration;
        
        // 验证时间参数 - 应用约束规则
        if (startTime < 0) {
            startTime = 0;
            startTimeInput.value = '0';
            showToast('开始时间不能小于0，已自动调整！');
        }
        if (endTime > videoElement.duration) {
            endTime = videoElement.duration;
            endTimeInput.value = videoElement.duration.toFixed(1);
            showToast('结束时间不能超过视频总时长，已自动调整！');
        }
        if (startTime >= endTime) {
            endTime = Math.min(startTime + 1, videoElement.duration); // 确保至少有1秒的裁剪时长
            endTimeInput.value = endTime.toFixed(1);
            showToast('开始时间不能大于或等于结束时间，已自动调整！');
        }
        if (endTime - startTime < 0.1) {
            endTime = Math.min(startTime + 0.1, videoElement.duration); // 确保至少有0.1秒的裁剪时长
            endTimeInput.value = endTime.toFixed(1);
            showToast('裁剪时长不能小于0.1秒，已自动调整！');
        }
        
        // 使用Canvas和MediaRecorder API尝试实现客户端视频裁剪
        performVideoCropping(cropParams, startTime, endTime);
        
    } catch (error) {
        console.error('裁剪视频时出错:', error);
        showToast('视频处理过程中出现错误，请重试。');
        // 启用裁剪按钮
        if (applyCropBtn) applyCropBtn.disabled = false;
    }
}

// 执行视频裁剪操作
async function performVideoCropping(cropParams, startTime, endTime) {
    try {
        // 检查浏览器兼容性
        if (!window.MediaRecorder || !MediaRecorder.isTypeSupported('video/webm')) {
            throw new Error('您的浏览器不支持MediaRecorder API或WebM格式');
        }
        
        // 检查裁剪参数
        if (!cropParams || cropParams.width <= 0 || cropParams.height <= 0) {
            throw new Error('无效的裁剪参数');
        }
        
        // 创建Canvas用于视频帧处理
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('无法创建Canvas上下文');
        }
        
        // 获取UI上的原始裁剪参数（未缩放的）
        // const uiCropX = parseFloat(cropXInput.value);
        // const uiCropY = parseFloat(cropYInput.value);
        // const uiCropWidth = parseFloat(cropWidthInput.value);
        // const uiCropHeight = parseFloat(cropHeightInput.value);
        
        // 使用实际视频尺寸作为Canvas尺寸，确保输出像素与配置一致
        canvas.width = Math.floor(cropParams.width);
        canvas.height = Math.floor(cropParams.height);
        
        // 显示处理中模态框
        showModal('处理中', '正在裁剪视频，请稍候...', false);
        
        // 设置视频到指定的开始时间
        videoElement.currentTime = startTime;
        
        // 等待视频帧加载完成
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('视频帧加载超时')), 5000);
            videoElement.addEventListener('seeked', () => {
                clearTimeout(timeout);
                resolve();
            }, { once: true });
        });
        
        // 检测支持的音频+视频编码格式，优先使用mp4
        const supportedMimeTypes = [
            'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
            'video/mp4;codecs=avc1.42E01E',
            'video/mp4',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,vorbis',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm'
        ];
        
        let selectedMimeType = null;
        for (const mimeType of supportedMimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                selectedMimeType = mimeType;
                break;
            }
        }
        
        if (!selectedMimeType) {
            throw new Error('您的浏览器不支持任何可用的视频编码格式');
        }
        
        // 使用更稳定的帧率，确保视频流畅
        const targetFps = 25;
        console.log(`使用帧率: ${targetFps}fps 以确保更稳定的视频质量`);
        const videoStream = canvas.captureStream(targetFps);
        
        // 尝试获取原始视频的音频流
        let audioStream = null;
        try {
            // 克隆原始视频的音频轨道
            const originalAudioTracks = videoElement.captureStream().getAudioTracks();
            if (originalAudioTracks.length > 0) {
                audioStream = new MediaStream();
                originalAudioTracks.forEach(track => {
                    const clonedTrack = track.clone();
                    audioStream.addTrack(clonedTrack);
                });
            }
        } catch (e) {
            console.warn('无法获取音频流:', e);
        }
        
        // 创建混合流（视频+音频）
        const mixedStream = new MediaStream();
        
        // 添加视频轨道
        videoStream.getVideoTracks().forEach(track => {
            mixedStream.addTrack(track);
        });
        
        // 添加音频轨道（如果有）
        if (audioStream) {
            audioStream.getAudioTracks().forEach(track => {
                mixedStream.addTrack(track);
            });
        }
        
        const chunks = [];
        // 配置MediaRecorder，提高音频质量
        const mediaRecorder = new MediaRecorder(mixedStream, {
            mimeType: selectedMimeType,
            audioBitsPerSecond: 128000, // 设置音频比特率为128kbps，提高音质
            videoBitsPerSecond: 2500000  // 设置视频比特率为2.5Mbps，平衡质量和文件大小
        });
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        mediaRecorder.onerror = (e) => {
            console.error('MediaRecorder错误:', e);
            showToast('视频录制过程中发生错误');
            // 启用裁剪按钮
            if (applyCropBtn) applyCropBtn.disabled = false;
        };
        
        mediaRecorder.onstop = () => {
            try {
                // 更新进度为100%
                updateProgress(100);
                
                const blob = new Blob(chunks, { type: selectedMimeType });
                const videoURL = URL.createObjectURL(blob);
                
                // 更新预览视频
                outputVideo.src = videoURL;
                outputVideo.currentTime = 0;
                
                // 显示结果部分
                if (outputSection) outputSection.style.display = 'block';
                
                // 恢复按钮状态
                resetCropButtonState();
                
                // 下载按钮的点击事件已在初始化时通过addEventListener绑定，无需重复设置
                // downloadBtn.onclick = () => downloadVideo();
                
            } catch (error) {
                console.error('处理裁剪结果时出错:', error);
                showToast('处理裁剪结果时出现错误');
                resetCropButtonState();
            }
        };
        
        // 开始录制
        mediaRecorder.start(1000); // 每秒记录一次数据
        
        // 计算需要录制的持续时间（毫秒），增加更大的缓冲区确保包含完整的时间范围
        // 特别是最后几秒的音频，因为音频流可能有延迟，并且需要确保完整的音频帧被捕获
        const durationMs = (endTime - startTime) * 1000 + 2000; // 增加2秒作为缓冲区，确保包含完整的音频
        
        // 保存开始时间，用于计算进度
        const processingStartTime = Date.now();
        
        // 开始播放视频以获取音频，确保视频在录制开始前已经播放
        await videoElement.play().catch(e => {
            console.warn('无法自动播放视频:', e);
            // 如果自动播放失败，尝试静音播放
            videoElement.muted = true;
            return videoElement.play();
        });
        
        // 创建帧处理循环，让视频自然播放以提高流畅度
        let isProcessing = true;
        let lastProgressUpdate = 0;
        const PROGRESS_UPDATE_INTERVAL_MS = 300; // 每300ms更新一次进度
        
        // 监听视频结束事件，确保完整录制
        function handleVideoEnded() {
            if (isProcessing) {
                stopRecording();
            }
        }
        
        videoElement.addEventListener('ended', handleVideoEnded);
        
        // 停止录制的函数
        function stopRecording() {
            isProcessing = false;
            updateProgress(90);
            
            try {
                mediaRecorder.stop();
            } catch (stopError) {
                console.error('停止录制时出错:', stopError);
                showToast('视频录制过程中发生错误');
                resetCropButtonState();
            }
            
            // 清理事件监听和定时器
            videoElement.removeEventListener('ended', handleVideoEnded);
            clearTimeout(stopRecordingTimeout);
        }
        
        // 设置安全定时器，确保录制会停止
        const stopRecordingTimeout = setTimeout(stopRecording, durationMs);
        
        // 简化的帧处理函数，直接使用视频当前帧
        function drawFrame() {
            if (!isProcessing) return;
            
            try {
                // 确保只在录制范围内绘制
                if (videoElement.currentTime >= startTime && videoElement.currentTime <= endTime) {
                    // 优化Canvas渲染
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'medium'; // 平衡质量和性能
                    
                    // 直接绘制当前视频帧，不进行复杂的时间同步
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(
                        videoElement,
                        cropParams.x, cropParams.y, cropParams.width, cropParams.height,
                        0, 0, canvas.width, canvas.height
                    );
                }
                
                // 更新进度
                const currentTime = Date.now();
                if (currentTime - lastProgressUpdate > PROGRESS_UPDATE_INTERVAL_MS) {
                    const processingElapsedMs = currentTime - processingStartTime;
                    const progressPercentage = Math.min(80, Math.round((processingElapsedMs / durationMs) * 80));
                    updateProgress(progressPercentage);
                    lastProgressUpdate = currentTime;
                }
                
                // 如果视频还在范围内，继续处理
                if (videoElement.currentTime <= endTime + 0.1 && isProcessing) {
                    requestAnimationFrame(drawFrame);
                } else if (isProcessing) {
                    stopRecording();
                }
            } catch (e) {
                console.error('帧处理错误:', e);
                // 出错时仍尝试继续处理
                if (isProcessing) {
                    requestAnimationFrame(drawFrame);
                }
            }
        }
        
        // 开始处理视频帧
        requestAnimationFrame(drawFrame);
        
        // 录制停止时清理资源
        mediaRecorder.addEventListener('stop', () => {
            // 延迟停止轨道，确保录制完成后的数据处理
            setTimeout(() => {
                try {
                    // 停止所有轨道
                    videoStream.getTracks().forEach(track => track.stop());
                    mixedStream.getTracks().forEach(track => track.stop());
                    if (audioStream) {
                        audioStream.getTracks().forEach(track => track.stop());
                    }
                } catch (trackError) {
                    console.warn('清理轨道时出错:', trackError);
                }
            }, 500); // 延迟500ms停止轨道
        });
        
    } catch (error) {
        console.error('执行视频裁剪时出错:', error);
        hideModal();
        
        // 清理资源
        try {
            if (typeof mixedStream !== 'undefined') {
                mixedStream.getTracks().forEach(track => track.stop());
            }
            if (typeof audioStream !== 'undefined') {
                audioStream.getTracks().forEach(track => track.stop());
            }
            if (typeof videoStream !== 'undefined') {
                videoStream.getTracks().forEach(track => track.stop());
            }
            // 清理定时器
            if (typeof stopRecordingTimeout !== 'undefined') {
                clearTimeout(stopRecordingTimeout);
            }
            // 清理事件监听
            videoElement.removeEventListener('ended', handleVideoEnded);
        } catch (cleanupError) {
            console.warn('清理资源时出错:', cleanupError);
        }
        
        showToast(`无法完成视频裁剪：${error.message}`);
        resetCropButtonState();
    }
}

// 更新进度条函数
function updateProgress(percentage) {
    console.log('更新进度:', percentage);
    // 限制百分比不超过100%
    const limitedPercentage = Math.min(100, Math.max(0, percentage));
    
    if (progressBar) {
        progressBar.style.width = `${limitedPercentage}%`;
        console.log('进度条宽度设置为:', `${limitedPercentage}%`);
    } else {
        console.error('progressBar元素未找到');
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = `${Math.round(limitedPercentage)}%`;
        console.log('进度百分比设置为:', `${Math.round(limitedPercentage)}%`);
    } else {
        console.error('progressPercentage元素未找到');
    }
}

// 下载视频
function downloadVideo() {
    if (!outputVideo.src) {
        showToast('请先裁剪视频！');
        return;
    }
    
    try {
        // 下载开始：置灰按钮并显示"下载中..."
        if (downloadBtn) {
            downloadBtn.style.opacity = '0.6';
            downloadBtn.style.cursor = 'not-allowed';
            downloadBtn.disabled = true;
            downloadBtn.textContent = '下载中...';
        }
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = outputVideo.src;  // 使用裁剪后的视频源
        
        // 生成文件名
        const timestamp = new Date().getTime();
        const baseName = currentVideoFile ? 
            `pengline-${currentVideoFile.name.replace(/\.[^/.]+$/, '')}` : 
            `pengline-video-${timestamp}`;
        
        // 根据MIME类型设置扩展名，优先使用mp4
        let extension = 'mp4';
        if (outputVideo.src.includes('video/webm')) {
            extension = 'webm';
        }
        
        downloadLink.download = `${baseName}.${extension}`;
        
        // 模拟点击下载
        document.body.appendChild(downloadLink);
        
        // 触发下载
        const clickEvent = new MouseEvent('click');
        downloadLink.dispatchEvent(clickEvent);
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(downloadLink);
        }, 100);
        
        // 下载完成后恢复按钮状态（延迟执行，确保下载过程完成）
        setTimeout(() => {
            if (downloadBtn) {
                downloadBtn.style.opacity = '1';
                downloadBtn.style.cursor = 'pointer';
                downloadBtn.disabled = false;
                downloadBtn.textContent = '下载裁剪视频';
            }
        }, 1000);
        
    } catch (error) {
        console.error('下载视频时出错:', error);
        showToast(`视频下载过程中出现错误：${error.message}`);
        
        // 下载失败：恢复按钮状态
        if (downloadBtn) {
            downloadBtn.style.opacity = '1';
            downloadBtn.style.cursor = 'pointer';
            downloadBtn.disabled = false;
            downloadBtn.textContent = '下载裁剪视频';
        }
    }
}

// 模态框相关函数已替换为Toast提示，保留但不再使用
function showModal(title, message, showClose = true) {
    // 兼容处理，使用Toast替代
    showToast(`${title}: ${message}`);
}

function hideModal() {
    // 兼容处理，无需操作
}

// 更新尺寸输入框的约束
function updateSizeInputConstraints() {
    const videoWidth = videoElement.videoWidth || 1000;
    const videoHeight = videoElement.videoHeight || 1000;
    
    // 设置X坐标的最大限制
    cropXInput.max = (videoWidth - parseFloat(cropWidthInput.value)).toFixed(0);
    
    // 设置Y坐标的最大限制
    cropYInput.max = (videoHeight - parseFloat(cropHeightInput.value)).toFixed(0);
    
    // 设置宽度的最大限制
    cropWidthInput.max = (videoWidth - parseFloat(cropXInput.value)).toFixed(0);
    
    // 设置高度的最大限制
    cropHeightInput.max = (videoHeight - parseFloat(cropYInput.value)).toFixed(0);
    
    // 确保X坐标不超过最大限制
    if (parseFloat(cropXInput.value) > parseFloat(cropXInput.max)) {
        cropXInput.value = cropXInput.max;
        updateCropBoxSelection();
    }
    
    // 确保Y坐标不超过最大限制
    if (parseFloat(cropYInput.value) > parseFloat(cropYInput.max)) {
        cropYInput.value = cropYInput.max;
        updateCropBoxSelection();
    }
    
    // 确保宽度不超过最大限制
    if (parseFloat(cropWidthInput.value) > parseFloat(cropWidthInput.max)) {
        cropWidthInput.value = cropWidthInput.max;
        updateCropBoxSelection();
    }
    
    // 确保高度不超过最大限制
    if (parseFloat(cropHeightInput.value) > parseFloat(cropHeightInput.max)) {
        cropHeightInput.value = cropHeightInput.max;
        updateCropBoxSelection();
    }
}

// 更新时间输入框的约束
function updateTimeInputConstraints() {
    const duration = videoElement.duration || 0;
    
    // 设置开始时间的最大限制（结束时间 - 最小时长）
    const endTime = parseFloat(endTimeInput.value) || duration;
    startTimeInput.max = (endTime - 0.1).toFixed(1);
    
    // 设置结束时间的最小限制（开始时间 + 最小时长）
    const startTime = parseFloat(startTimeInput.value) || 0;
    endTimeInput.min = (startTime + 0.1).toFixed(1);
    
    // 确保开始时间不小于0
    if (parseFloat(startTimeInput.value) < 0) {
        startTimeInput.value = '0';
        showToast('开始时间不能小于0，已自动调整！');
    }
    
    // 确保开始时间不超过最大限制
    if (parseFloat(startTimeInput.value) > parseFloat(startTimeInput.max)) {
        startTimeInput.value = startTimeInput.max;
    }
    
    // 确保结束时间不小于最小限制
    if (parseFloat(endTimeInput.value) < parseFloat(endTimeInput.min)) {
        endTimeInput.value = endTimeInput.min;
    }
    
    // 确保结束时间不超过视频总时长
    if (parseFloat(endTimeInput.value) > duration) {
        endTimeInput.value = duration.toFixed(1);
    }
}

// 格式化时间
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}