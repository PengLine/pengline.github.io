// 获取DOM元素
const imageUpload = document.getElementById('imageUpload');
const watermarkTypeRadios = document.querySelectorAll('input[name="watermarkType"]');
const watermarkText = document.getElementById('watermarkText');
const watermarkColor = document.getElementById('watermarkColor');
const watermarkOpacity = document.getElementById('watermarkOpacity');
const opacityValue = document.getElementById('opacityValue');
const watermarkSize = document.getElementById('watermarkSize');
const sizeValue = document.getElementById('sizeValue');
const watermarkPosition = document.getElementById('watermarkPosition');
const previewContainer = document.getElementById('previewContainer');
const downloadImage = document.getElementById('downloadImage');
const textWatermarkGroup = document.getElementById('textWatermarkGroup');
const imageWatermarkGroup = document.getElementById('imageWatermarkGroup');
const imageWatermarkUpload = document.getElementById('imageWatermarkUpload');
const manualPositionInfo = document.getElementById('manualPositionInfo');

// 全局变量
let uploadedImage = null;
let canvas = null;
let ctx = null;
let imageCacheCanvas = null; // 用于缓存原图的Canvas
let imageCacheCtx = null;
let originalImageWidth = 0; // 保存原始图像宽度
let originalImageHeight = 0; // 保存原始图像高度
let originalFileName = ''; // 保存原始文件名
let originalImageFormat = ''; // 保存原始图像格式
let watermarkImage = null; // 保存水印图片
let watermarkImageOpacity = 30; // 水印图片透明度（默认30%）
let watermarkImageSize = 100; // 水印图片大小（默认100px）

// 辅助函数：获取当前选中的水印类型
function getSelectedWatermarkType() {
    const selectedRadio = document.querySelector('input[name="watermarkType"]:checked');
    return selectedRadio ? selectedRadio.value : 'text'; // 默认返回'text'
}

// 拖动相关变量
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let manualWatermarkX = 0;
let manualWatermarkY = 0;
let isWatermarkOverlapping = false;

// 初始化事件监听器
function initEventListeners() {
    // 图片上传事件
    imageUpload.addEventListener('change', handleImageUpload);
    
    // 水印类型切换事件
    watermarkTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'text') {
                textWatermarkGroup.style.display = 'flex';
                imageWatermarkGroup.style.display = 'none';
            } else {
                textWatermarkGroup.style.display = 'none';
                imageWatermarkGroup.style.display = 'flex';
            }
            if (uploadedImage) applyWatermarkToImage();
        });
    });
    
    // 水印图片上传事件
    imageWatermarkUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                watermarkImage = img;
                if (uploadedImage) applyWatermarkToImage();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    // 水印设置变化事件
    watermarkOpacity.addEventListener('input', () => {
        opacityValue.textContent = `${watermarkOpacity.value}%`;
        if (uploadedImage) applyWatermarkToImage();
    });
    
    watermarkSize.addEventListener('input', () => {
        sizeValue.textContent = `${watermarkSize.value}px`;
        if (uploadedImage) applyWatermarkToImage();
    });
    
    watermarkText.addEventListener('input', () => {
        if (uploadedImage) applyWatermarkToImage();
    });
    
    watermarkColor.addEventListener('input', () => {
        if (uploadedImage) applyWatermarkToImage();
    });
    
    watermarkPosition.addEventListener('change', () => {
        // 显示或隐藏手动定位提示信息
        if (watermarkPosition.value === 'manual') {
            manualPositionInfo.style.display = 'block';
        } else {
            manualPositionInfo.style.display = 'none';
        }
        
        if (uploadedImage) {
            // 如果不是手动模式，根据当前选择的位置更新手动位置变量
            if (watermarkPosition.value !== 'manual') {
                const size = parseInt(watermarkSize.value);
                const safeMargin = Math.min(20, Math.max(canvas.width, canvas.height) * 0.05);
                
                if (getSelectedWatermarkType() === 'text') {
                    const text = watermarkText.value || '水印';
                    ctx.font = `${size}px Arial`;
                    const textWidth = ctx.measureText(text).width;
                    
                    switch(watermarkPosition.value) {
                        case 'top-left':
                            manualWatermarkX = safeMargin + textWidth / 2;
                            manualWatermarkY = safeMargin + size / 2;
                            break;
                        case 'top-right':
                            manualWatermarkX = canvas.width - safeMargin - textWidth / 2;
                            manualWatermarkY = safeMargin + size / 2;
                            break;
                        case 'bottom-left':
                            manualWatermarkX = safeMargin + textWidth / 2;
                            manualWatermarkY = canvas.height - safeMargin - size / 2;
                            break;
                        case 'bottom-right':
                            manualWatermarkX = canvas.width - safeMargin - textWidth / 2;
                            manualWatermarkY = canvas.height - safeMargin - size / 2;
                            break;
                        case 'center':
                        default:
                            manualWatermarkX = canvas.width / 2;
                            manualWatermarkY = canvas.height / 2;
                            break;
                    }
                } else if (getSelectedWatermarkType() === 'image' && watermarkImage) {
                    // 图片水印
                    switch(watermarkPosition.value) {
                        case 'top-left':
                            manualWatermarkX = safeMargin + size / 2;
                            manualWatermarkY = safeMargin + size / 2;
                            break;
                        case 'top-right':
                            manualWatermarkX = canvas.width - safeMargin - size / 2;
                            manualWatermarkY = safeMargin + size / 2;
                            break;
                        case 'bottom-left':
                            manualWatermarkX = safeMargin + size / 2;
                            manualWatermarkY = canvas.height - safeMargin - size / 2;
                            break;
                        case 'bottom-right':
                            manualWatermarkX = canvas.width - safeMargin - size / 2;
                            manualWatermarkY = canvas.height - safeMargin - size / 2;
                            break;
                        case 'center':
                        default:
                            manualWatermarkX = canvas.width / 2;
                            manualWatermarkY = canvas.height / 2;
                            break;
                    }
                }
            }
            applyWatermarkToImage();
        }
    });
    
    // 按钮点击事件
    downloadImage.addEventListener('click', downloadWatermarkedImage);
}

// 处理图片上传
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 保存原始文件名（不包含扩展名）
    const fileName = file.name;
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    originalFileName = nameWithoutExt;
    
    // 保存原始图像格式
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    // 确定图片的MIME类型
    if (fileExtension === '.png') {
        originalImageFormat = 'image/png';
    } else if (fileExtension === '.webp') {
        originalImageFormat = 'image/webp';
    } else if (fileExtension === '.svg') {
        originalImageFormat = 'image/svg+xml';
    } else {
        // 对于其他格式（jpg、jpeg等），默认使用jpeg
        originalImageFormat = 'image/jpeg';
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            uploadedImage = img;
            // 保存原始图像尺寸
            originalImageWidth = img.width;
            originalImageHeight = img.height;
            
            createCanvas(img.width, img.height);
            applyWatermarkToImage();
            downloadImage.disabled = false;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 创建Canvas元素
function createCanvas(width, height) {
    // 移除已有的Canvas
    if (canvas) {
        previewContainer.removeChild(canvas);
    }
    
    // 获取预览容器的实际尺寸
    const containerStyle = window.getComputedStyle(previewContainer);
    const containerWidth = parseInt(containerStyle.maxWidth) || parseInt(containerStyle.width);
    const containerHeight = parseInt(containerStyle.maxHeight) || 500; // 默认最大高度500px
    
    // 计算调整后的图像尺寸，保持原始宽高比
    let newWidth = width;
    let newHeight = height;
    
    // 如果图像尺寸大于容器，按比例缩小
    if (width > containerWidth || height > containerHeight) {
        const widthRatio = containerWidth / width;
        const heightRatio = containerHeight / height;
        const scaleRatio = Math.min(widthRatio, heightRatio);
        
        newWidth = Math.floor(width * scaleRatio);
        newHeight = Math.floor(height * scaleRatio);
    }
    
    // 创建新的Canvas
    canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx = canvas.getContext('2d');
    
    // 设置Canvas样式，确保在容器中居中显示
    canvas.style.display = 'block';
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '500px';
    
    // 清空预览容器并添加Canvas
    previewContainer.innerHTML = '';
    previewContainer.appendChild(canvas);
    
    // 添加鼠标事件监听器以支持水印拖动
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // 创建缓存Canvas用于存储原始图像
    imageCacheCanvas = document.createElement('canvas');
    imageCacheCanvas.width = newWidth;
    imageCacheCanvas.height = newHeight;
    imageCacheCtx = imageCacheCanvas.getContext('2d');
    
    // 绘制原始图像到缓存Canvas
    imageCacheCtx.drawImage(uploadedImage, 0, 0, newWidth, newHeight);
    
    // 如果图像原始尺寸较大，添加提示信息
    if (width > containerWidth || height > containerHeight) {
        const resizeInfo = document.createElement('div');
        resizeInfo.textContent = `图像已调整大小以适应预览 (原始: ${width}×${height}px)`;
        resizeInfo.style.position = 'absolute';
        resizeInfo.style.bottom = '10px';
        resizeInfo.style.left = '50%';
        resizeInfo.style.transform = 'translateX(-50%)';
        resizeInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        resizeInfo.style.color = 'white';
        resizeInfo.style.padding = '5px 10px';
        resizeInfo.style.borderRadius = '4px';
        resizeInfo.style.fontSize = '12px';
        resizeInfo.style.zIndex = '100';
        previewContainer.appendChild(resizeInfo);
        
        // 3秒后自动隐藏提示
        setTimeout(() => {
            resizeInfo.style.opacity = '0';
            resizeInfo.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (previewContainer.contains(resizeInfo)) {
                    previewContainer.removeChild(resizeInfo);
                }
            }, 500);
        }, 3000);
    }
}

// 检查点击是否在水印上
function isPointInWatermark(x, y) {
    if (!uploadedImage || watermarkPosition.value === 'tiled') return false;
    
    const size = parseInt(watermarkSize.value);
    
    // 如果是文字水印，估算水印区域
    if (getSelectedWatermarkType() === 'text') {
        const text = watermarkText.value || '水印';
        ctx.font = `${size}px Arial`;
        const textWidth = ctx.measureText(text).width;
        const textHeight = size;
        
        let watermarkX, watermarkY;
        if (watermarkPosition.value === 'manual') {
            watermarkX = manualWatermarkX;
            watermarkY = manualWatermarkY;
        } else {
            // 根据预设位置计算水印中心点
            const safeMargin = Math.min(20, Math.max(canvas.width, canvas.height) * 0.05);
            
            switch(watermarkPosition.value) {
                case 'top-left':
                    watermarkX = safeMargin + textWidth / 2;
                    watermarkY = safeMargin + textHeight / 2;
                    break;
                case 'top-right':
                    watermarkX = canvas.width - safeMargin - textWidth / 2;
                    watermarkY = safeMargin + textHeight / 2;
                    break;
                case 'bottom-left':
                    watermarkX = safeMargin + textWidth / 2;
                    watermarkY = canvas.height - safeMargin - textHeight / 2;
                    break;
                case 'bottom-right':
                    watermarkX = canvas.width - safeMargin - textWidth / 2;
                    watermarkY = canvas.height - safeMargin - textHeight / 2;
                    break;
                case 'center':
                default:
                    watermarkX = canvas.width / 2;
                    watermarkY = canvas.height / 2;
                    break;
            }
        }
        
        // 检查点是否在文字水印区域内（扩大区域以提高用户体验）
        return x >= watermarkX - textWidth / 2 - 10 &&
               x <= watermarkX + textWidth / 2 + 10 &&
               y >= watermarkY - textHeight / 2 - 10 &&
               y <= watermarkY + textHeight / 2 + 10;
    }
    // 如果是图片水印
    else if (getSelectedWatermarkType() === 'image' && watermarkImage) {
        let watermarkX, watermarkY;
        if (watermarkPosition.value === 'manual') {
            watermarkX = manualWatermarkX;
            watermarkY = manualWatermarkY;
        } else {
            // 根据预设位置计算水印中心点
            const safeMargin = Math.min(20, Math.max(canvas.width, canvas.height) * 0.05);
            
            switch(watermarkPosition.value) {
                case 'top-left':
                    watermarkX = safeMargin + size / 2;
                    watermarkY = safeMargin + size / 2;
                    break;
                case 'top-right':
                    watermarkX = canvas.width - safeMargin - size / 2;
                    watermarkY = safeMargin + size / 2;
                    break;
                case 'bottom-left':
                    watermarkX = safeMargin + size / 2;
                    watermarkY = canvas.height - safeMargin - size / 2;
                    break;
                case 'bottom-right':
                    watermarkX = canvas.width - safeMargin - size / 2;
                    watermarkY = canvas.height - safeMargin - size / 2;
                    break;
                case 'center':
                default:
                    watermarkX = canvas.width / 2;
                    watermarkY = canvas.height / 2;
                    break;
            }
        }
        
        // 检查点是否在图片水印区域内
        return x >= watermarkX - size / 2 &&
               x <= watermarkX + size / 2 &&
               y >= watermarkY - size / 2 &&
               y <= watermarkY + size / 2;
    }
    
    return false;
}

// 处理鼠标按下事件
function handleMouseDown(e) {
    if (!uploadedImage || watermarkPosition.value === 'tiled') return;
    
    // 获取鼠标在Canvas上的坐标
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击在水印上
    if (isPointInWatermark(x, y)) {
        isDragging = true;
        
        // 设置拖动偏移量
        dragOffsetX = x - manualWatermarkX;
        dragOffsetY = y - manualWatermarkY;
        
        // 切换到手动位置模式
        if (watermarkPosition.value !== 'manual') {
            watermarkPosition.value = 'manual';
        }
        
        // 改变鼠标样式
        canvas.style.cursor = 'grabbing';
        
        // 重新绘制水印，添加拖动指示器
        applyWatermarkToImage();
    }
}

// 处理鼠标移动事件
function handleMouseMove(e) {
    if (!uploadedImage || watermarkPosition.value === 'tiled') return;
    
    // 获取鼠标在Canvas上的坐标
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 如果正在拖动
    if (isDragging) {
        // 计算新的水印位置（确保不超出Canvas边界）
        const newX = Math.max(0, Math.min(canvas.width, x - dragOffsetX));
        const newY = Math.max(0, Math.min(canvas.height, y - dragOffsetY));
        
        // 更新水印位置
        manualWatermarkX = newX;
        manualWatermarkY = newY;
        
        // 重新绘制水印
        applyWatermarkToImage();
    } else {
        // 检查鼠标是否悬停在水印上
        const isOverWatermark = isPointInWatermark(x, y);
        
        // 更新鼠标样式
        canvas.style.cursor = isOverWatermark ? 'grab' : 'default';
        
        // 如果鼠标悬停状态改变，重新绘制水印
        if (isOverWatermark !== isWatermarkOverlapping) {
            isWatermarkOverlapping = isOverWatermark;
            applyWatermarkToImage();
        }
    }
}

// 处理鼠标释放事件
function handleMouseUp() {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'default';
        
        // 重新绘制水印，移除拖动指示器
        applyWatermarkToImage();
    }
}

// 应用水印到图片
function applyWatermarkToImage() {
    if (!uploadedImage || !ctx || !imageCacheCanvas) return;
    
    // 清空Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 使用缓存的原始图像，避免重复绘制原图
    ctx.drawImage(imageCacheCanvas, 0, 0);
    
    // 获取水印设置
    const opacity = watermarkOpacity.value / 100;
    const size = parseInt(watermarkSize.value);
    const position = watermarkPosition.value;
    
    // 保存当前Canvas状态，包括globalAlpha
    ctx.save();
    
    // 设置水印透明度
    ctx.globalAlpha = opacity;
    
    // 根据水印类型应用不同的水印
    if (getSelectedWatermarkType() === 'text') {
        // 文字水印
        const text = watermarkText.value || '水印';
        const color = watermarkColor.value;
        
        // 设置水印样式
        ctx.fillStyle = color;
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 计算水印文本的宽度
        const textWidth = ctx.measureText(text).width;
        
        // 根据图像大小和水印大小计算合适的边距，确保水印不会超出边界
        const safeMargin = Math.min(20, Math.max(canvas.width, canvas.height) * 0.05);
        
        // 根据位置应用水印，确保不会超出图像边界
        switch(position) {
            case 'manual':
                // 手动位置模式
                ctx.fillText(text, manualWatermarkX, manualWatermarkY);
                
                // 如果鼠标悬停在水印上，绘制拖动指示器
                if (isWatermarkOverlapping) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(manualWatermarkX - textWidth/2 - 5, manualWatermarkY - size/2 - 5, textWidth + 10, size + 10);
                }
                break;
            case 'top-left':
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(text, safeMargin, safeMargin);
                break;
            case 'top-right':
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                // 确保水印不会超出右侧边界
                const rightX = Math.min(canvas.width - safeMargin, canvas.width);
                ctx.fillText(text, rightX, safeMargin);
                break;
            case 'bottom-left':
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                // 确保水印不会超出底部边界
                const bottomY = Math.min(canvas.height - safeMargin, canvas.height);
                ctx.fillText(text, safeMargin, bottomY);
                break;
            case 'bottom-right':
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                const rightX2 = Math.min(canvas.width - safeMargin, canvas.width);
                const bottomY2 = Math.min(canvas.height - safeMargin, canvas.height);
                ctx.fillText(text, rightX2, bottomY2);
                break;
            case 'center':
                ctx.fillText(text, canvas.width / 2, canvas.height / 2);
                break;
            case 'tiled':
                applyTiledWatermark(text, size);
                break;
        }
    } else if (getSelectedWatermarkType() === 'image' && watermarkImage) {
        // 图片水印
        // 根据图像大小和水印大小计算合适的边距，确保水印不会超出边界
        const safeMargin = Math.min(20, Math.max(canvas.width, canvas.height) * 0.05);
        
        // 根据位置应用图片水印
        switch(position) {
            case 'manual':
                // 手动位置模式
                ctx.drawImage(watermarkImage, manualWatermarkX - size/2, manualWatermarkY - size/2, size, size);
                
                // 如果鼠标悬停在水印上，绘制拖动指示器
                if (isWatermarkOverlapping) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(manualWatermarkX - size/2 - 5, manualWatermarkY - size/2 - 5, size + 10, size + 10);
                }
                break;
            case 'top-left':
                ctx.drawImage(watermarkImage, safeMargin, safeMargin, size, size);
                break;
            case 'top-right':
                ctx.drawImage(watermarkImage, canvas.width - size - safeMargin, safeMargin, size, size);
                break;
            case 'bottom-left':
                ctx.drawImage(watermarkImage, safeMargin, canvas.height - size - safeMargin, size, size);
                break;
            case 'bottom-right':
                ctx.drawImage(watermarkImage, canvas.width - size - safeMargin, canvas.height - size - safeMargin, size, size);
                break;
            case 'center':
                ctx.drawImage(watermarkImage, (canvas.width - size) / 2, (canvas.height - size) / 2, size, size);
                break;
            case 'tiled':
                applyTiledImageWatermark(size);
                break;
        }
    }
    
    // 恢复Canvas状态，确保globalAlpha等设置不会影响后续绘制
    ctx.restore();
}

// 应用平铺水印
function applyTiledWatermark(text, size) {
    const angle = -Math.PI / 6; // 45度角（弧度）
    
    // 保存当前状态
    ctx.save();
    
    // 计算水印文本的宽度
    const textWidth = ctx.measureText(text).width;
    
    // 根据水印大小和图像比例动态计算间距，确保水印不会超出图像边界
    const baseGap = Math.max(textWidth * 1.5, size * 2); // 间距基于文本宽度和大小
    const gap = Math.min(baseGap, Math.max(canvas.width, canvas.height) / 4); // 限制最大间距
    
    // 获取Canvas的对角线长度，用于计算水印范围
    const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    
    // 计算实际需要绘制的水印数量
    const count = Math.ceil(diagonal / (gap * 0.8)); // 使用较小的系数确保完全覆盖
    
    // 移动到Canvas中心并旋转
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    
    // 计算绘制范围，确保水印不会超出图像边界
    const drawRange = diagonal * 0.6; // 稍微缩小绘制范围
    
    // 绘制平铺水印
    for (let i = -count; i < count; i++) {
        for (let j = -count; j < count; j++) {
            const x = i * gap;
            const y = j * gap;
            
            // 只绘制在图像边界内的水印
            if (Math.abs(x) < drawRange && Math.abs(y) < drawRange) {
                ctx.fillText(text, x, y);
            }
        }
    }
    
    // 恢复之前的状态
    ctx.restore();
}

// 应用平铺图片水印
function applyTiledImageWatermark(size) {
    if (!watermarkImage) return;
    
    const angle = -Math.PI / 6; // 45度角（弧度）
    
    // 保存当前状态
    ctx.save();
    
    // 根据水印大小和图像比例动态计算间距，确保水印不会超出图像边界
    const gap = Math.max(size * 1.5, Math.max(canvas.width, canvas.height) / 6); // 间距基于水印大小
    
    // 获取Canvas的对角线长度，用于计算水印范围
    const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    
    // 计算实际需要绘制的水印数量
    const count = Math.ceil(diagonal / (gap * 0.8)); // 使用较小的系数确保完全覆盖
    
    // 移动到Canvas中心并旋转
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    
    // 计算绘制范围，确保水印不会超出图像边界
    const drawRange = diagonal * 0.6; // 稍微缩小绘制范围
    
    // 绘制平铺水印
    for (let i = -count; i < count; i++) {
        for (let j = -count; j < count; j++) {
            const x = i * gap;
            const y = j * gap;
            
            // 只绘制在图像边界内的水印
            if (Math.abs(x) < drawRange && Math.abs(y) < drawRange) {
                ctx.drawImage(watermarkImage, x - size / 2, y - size / 2, size, size);
            }
        }
    }
    
    // 恢复之前的状态
    ctx.restore();
}

// 在原始尺寸的Canvas上应用平铺水印
function applyTiledWatermarkToOriginal(ctx, text, size) {
    // 设置水印样式
    ctx.font = `${size}px Arial`;
    
    // 旋转水印
    ctx.save();
    ctx.rotate(-Math.PI / 6); // -30度角
    
    // 计算文本宽度
    const textWidth = ctx.measureText(text).width;
    
    // 计算动态间距，使水印之间有适当的间隔
    const gap = Math.max(textWidth * 2, 100);
    
    // 获取Canvas的对角线长度，确保水印覆盖整个图像
    const diagonalLength = Math.sqrt(originalImageWidth * originalImageWidth + originalImageHeight * originalImageHeight);
    
    // 计算需要绘制的水印数量
    const count = Math.ceil(diagonalLength / gap) + 1;
    
    // 计算绘制范围（基于原始尺寸）
    const drawRange = diagonalLength / 2 + gap;
    
    // 调整坐标系统中心到Canvas中心
    ctx.translate(originalImageWidth / 2, originalImageHeight / 2);
    
    // 绘制平铺水印
    for (let i = -count; i < count; i++) {
        for (let j = -count; j < count; j++) {
            const x = i * gap;
            const y = j * gap;
            
            // 只绘制在图像边界内的水印
            if (Math.abs(x) < drawRange && Math.abs(y) < drawRange) {
                ctx.fillText(text, x, y);
            }
        }
    }
    
    // 恢复之前的状态
    ctx.restore();
}

// 在原始尺寸的Canvas上应用平铺图片水印
function applyTiledImageWatermarkToOriginal(ctx, size) {
    if (!watermarkImage) return;
    
    // 旋转水印
    ctx.save();
    ctx.rotate(-Math.PI / 6); // -30度角
    
    // 计算动态间距，使水印之间有适当的间隔
    const gap = Math.max(size * 1.5, 150);
    
    // 获取Canvas的对角线长度，确保水印覆盖整个图像
    const diagonalLength = Math.sqrt(originalImageWidth * originalImageWidth + originalImageHeight * originalImageHeight);
    
    // 计算需要绘制的水印数量
    const count = Math.ceil(diagonalLength / gap) + 1;
    
    // 计算绘制范围（基于原始尺寸）
    const drawRange = diagonalLength / 2 + gap;
    
    // 调整坐标系统中心到Canvas中心
    ctx.translate(originalImageWidth / 2, originalImageHeight / 2);
    
    // 绘制平铺水印
    for (let i = -count; i < count; i++) {
        for (let j = -count; j < count; j++) {
            const x = i * gap;
            const y = j * gap;
            
            // 只绘制在图像边界内的水印
            if (Math.abs(x) < drawRange && Math.abs(y) < drawRange) {
                ctx.drawImage(watermarkImage, x - size / 2, y - size / 2, size, size);
            }
        }
    }
    
    // 恢复之前的状态
    ctx.restore();
}

// 下载带水印的图片
function downloadWatermarkedImage() {
    if (!uploadedImage) return;
    
    // 创建一个与原始图像尺寸相同的临时Canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalImageWidth;
    tempCanvas.height = originalImageHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 在临时Canvas上绘制原始图像
    tempCtx.drawImage(uploadedImage, 0, 0);
    
    // 获取水印设置
    const opacity = watermarkOpacity.value / 100;
    const size = parseInt(watermarkSize.value);
    const position = watermarkPosition.value;
    
    // 保存临时Canvas状态
    tempCtx.save();
    
    // 设置水印透明度
    tempCtx.globalAlpha = opacity;
    
    // 根据水印类型在原始尺寸的Canvas上应用水印
    if (getSelectedWatermarkType() === 'text') {
        const text = watermarkText.value || '水印';
        const color = watermarkColor.value;
        
        // 设置水印样式
        tempCtx.fillStyle = color;
        tempCtx.font = `${size}px Arial`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        
        // 计算水印文本的宽度
        const textWidth = tempCtx.measureText(text).width;
        
        // 根据图像大小和水印大小计算合适的边距，确保水印不会超出边界
        const safeMargin = Math.min(20, Math.max(originalImageWidth, originalImageHeight) * 0.05);
        
        // 根据位置在原始尺寸的Canvas上应用水印
        switch(position) {
            case 'manual':
                // 手动位置模式 - 计算预览到原始尺寸的缩放比例
                const scaleX = originalImageWidth / canvas.width;
                const scaleY = originalImageHeight / canvas.height;
                tempCtx.fillText(text, manualWatermarkX * scaleX, manualWatermarkY * scaleY);
                break;
            case 'top-left':
                tempCtx.textAlign = 'left';
                tempCtx.textBaseline = 'top';
                tempCtx.fillText(text, safeMargin, safeMargin);
                break;
            case 'top-right':
                tempCtx.textAlign = 'right';
                tempCtx.textBaseline = 'top';
                const rightX = Math.min(originalImageWidth - safeMargin, originalImageWidth);
                tempCtx.fillText(text, rightX, safeMargin);
                break;
            case 'bottom-left':
                tempCtx.textAlign = 'left';
                tempCtx.textBaseline = 'bottom';
                const bottomY = Math.min(originalImageHeight - safeMargin, originalImageHeight);
                tempCtx.fillText(text, safeMargin, bottomY);
                break;
            case 'bottom-right':
                tempCtx.textAlign = 'right';
                tempCtx.textBaseline = 'bottom';
                const rightX2 = Math.min(originalImageWidth - safeMargin, originalImageWidth);
                const bottomY2 = Math.min(originalImageHeight - safeMargin, originalImageHeight);
                tempCtx.fillText(text, rightX2, bottomY2);
                break;
            case 'center':
                tempCtx.fillText(text, originalImageWidth / 2, originalImageHeight / 2);
                break;
            case 'tiled':
                // 为平铺水印创建一个临时函数，使用原始尺寸
                applyTiledWatermarkToOriginal(tempCtx, text, size);
                break;
        }
    } else if (getSelectedWatermarkType() === 'image' && watermarkImage) {
        // 图片水印
        // 根据图像大小和水印大小计算合适的边距，确保水印不会超出边界
        const safeMargin = Math.min(20, Math.max(originalImageWidth, originalImageHeight) * 0.05);
        
        // 根据位置在原始尺寸的Canvas上应用图片水印
        switch(position) {
            case 'manual':
                // 手动位置模式 - 计算预览到原始尺寸的缩放比例
                const scaleX = originalImageWidth / canvas.width;
                const scaleY = originalImageHeight / canvas.height;
                const scaledSize = size * scaleX; // 假设宽高比例相同
                tempCtx.drawImage(watermarkImage, manualWatermarkX * scaleX - scaledSize/2, manualWatermarkY * scaleY - scaledSize/2, scaledSize, scaledSize);
                break;
            case 'top-left':
                tempCtx.drawImage(watermarkImage, safeMargin, safeMargin, size, size);
                break;
            case 'top-right':
                tempCtx.drawImage(watermarkImage, originalImageWidth - size - safeMargin, safeMargin, size, size);
                break;
            case 'bottom-left':
                tempCtx.drawImage(watermarkImage, safeMargin, originalImageHeight - size - safeMargin, size, size);
                break;
            case 'bottom-right':
                tempCtx.drawImage(watermarkImage, originalImageWidth - size - safeMargin, originalImageHeight - size - safeMargin, size, size);
                break;
            case 'center':
                tempCtx.drawImage(watermarkImage, (originalImageWidth - size) / 2, (originalImageHeight - size) / 2, size, size);
                break;
            case 'tiled':
                // 为平铺图片水印创建一个临时函数，使用原始尺寸
                applyTiledImageWatermarkToOriginal(tempCtx, size);
                break;
        }
    }
    
    // 恢复临时Canvas状态
    tempCtx.restore();
    
    // 创建下载链接，使用原始尺寸的图像
    const link = document.createElement('a');
    
    // 根据原始图像格式决定是否使用压缩
    let imageFormat, imageQuality, fileExtension;
    
    // 使用"hengline-原名.扩展名"的格式命名文件
    const downloadFileName = originalFileName ? `hengline-${originalFileName}` : `hengline-${Date.now()}`;
    
    // 对于PNG和WebP等无损格式，保持原始格式不压缩
    if (originalImageFormat === 'image/png') {
        imageFormat = originalImageFormat;
        fileExtension = 'png';
        link.download = `${downloadFileName}.${fileExtension}`;
        
        // 使用toBlob方法处理PNG格式，比toDataURL更适合保持无损质量
        tempCanvas.toBlob(function(blob) {
            // 使用URL.createObjectURL创建下载链接
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.click();
            // 释放URL对象以节省内存
            URL.revokeObjectURL(url);
        }, imageFormat);
        
        // 由于toBlob是异步的，此处返回以避免后续代码执行
        return;
    } else if (originalImageFormat === 'image/webp' || originalImageFormat === 'image/svg+xml') {
        imageFormat = originalImageFormat;
        imageQuality = 1.0; // 不压缩
        // 根据格式设置文件扩展名
        if (originalImageFormat === 'image/webp') {
            fileExtension = 'webp';
        } else {
            fileExtension = 'svg';
        }
        link.download = `${downloadFileName}.${fileExtension}`;
        // 使用toDataURL的最高质量设置
        link.href = tempCanvas.toDataURL(imageFormat, imageQuality);
        link.click();
        return;
    } else {
        // 对于其他格式（jpg、jpeg等），使用JPG格式并应用适度压缩
        imageFormat = 'image/jpeg';
        imageQuality = 0.88; // 适度压缩
        fileExtension = 'jpg';
        link.download = `${downloadFileName}.${fileExtension}`;
        link.href = tempCanvas.toDataURL(imageFormat, imageQuality);
        link.click();
    }
}

// 初始化应用
function initApp() {
    initEventListeners();
}

// 当页面加载完成后初始化应用
window.addEventListener('load', initApp);