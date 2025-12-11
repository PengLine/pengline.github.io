// 视频遮挡工具 - 全新实现
// 功能：支持添加文字、图片遮挡、马赛克，默认居中显示，支持颜色选择、大小设置和位置拖放，实时预览，一键应用

// DOM元素引用
const videoUpload = document.getElementById('mosaic-videoUpload');
const videoInfoElement = document.getElementById('mosaic-videoInfo');
const videoPlayer = document.getElementById('mosaic-videoPlayer');
const canvas = document.getElementById('mosaic-canvas');
const ctx = canvas.getContext('2d');
const mosaicBox = document.getElementById('mosaic-mosaicBox');
const videoContainer = videoPlayer.parentElement;
const videoOverlay = document.getElementById('mosaic-video-overlay');

// 设置区域元素
const settingsSection = document.getElementById('mosaic-settingsSection');
const outputSection = document.getElementById('mosaic-outputSection');
const applyMosaicBtn = document.getElementById('mosaic-applyMosaicBtn');
const removeAllBtn = document.getElementById('mosaic-removeAllBtn');
const downloadBtn = document.getElementById('mosaic-downloadBtn');
const outputVideo = document.getElementById('mosaic-outputVideo');

// 进度条元素
const progressContainer = document.querySelector('.mosaic-progress-container');
const progressBar = document.getElementById('mosaic-progressBar');
const progressPercentage = document.getElementById('mosaic-progressPercentage');

// 遮挡类型相关元素
const mosaicTypeSelect = document.getElementById('mosaic-type');
const mosaicSizeSection = document.getElementById('mosaic-mosaic-size-section');
const mosaicSizeInput = document.getElementById('mosaic-mosaicSize');
const mosaicColorInput = document.getElementById('mosaic-mosaicColor');
const blurOpacityInput = document.getElementById('mosaic-blurOpacity');
const textSection = document.getElementById('mosaic-text-section');
const mosaicTextInput = document.getElementById('mosaic-text');
const mosaicTextSizeInput = document.getElementById('mosaic-textSize');
const mosaicTextColorInput = document.getElementById('mosaic-textColor');
const mosaicTextScrollInput = document.getElementById('mosaic-textScroll');
const mosaicTextPositionInput = document.getElementById('mosaic-textPosition');
const mosaicTextScrollSpeedInput = document.getElementById('mosaic-textScrollSpeed');
const scrollSpeedValueDisplay = document.getElementById('mosaic-scrollSpeedValue');
const mosaicTextOpacityInput = document.getElementById('mosaic-textOpacity');
const textOpacityValueDisplay = document.getElementById('mosaic-textOpacityValue');
const imageSection = document.getElementById('mosaic-image-section');
const mosaicImageUpload = document.getElementById('mosaic-imageUpload');
const imageSizeInput = document.getElementById('mosaic-imageSize');
const mosaicImagePositionInput = document.getElementById('mosaic-imagePosition');
const mosaicImageOpacityInput = document.getElementById('mosaic-imageOpacity');
const imageOpacityValueDisplay = document.getElementById('mosaic-imageOpacityValue');
const areaSizeInput = document.getElementById('mosaic-areaSize'); // 遮挡区域大小

// 时间设置相关元素
const startTimeInput = document.getElementById('mosaic-startTime');
const endTimeInput = document.getElementById('mosaic-endTime');
const totalDurationDisplay = document.getElementById('mosaic-totalDuration');

// 全局变量
let videoRatio = 1;         // 视频比例
let videoRect = null;       // 视频容器位置和尺寸
let videoDuration = 0;      // 视频总时长
let originalVideoFilename = ''; // 原始视频文件名
let currentVideoBlobURL = null; // 当前视频的Blob URL
let processedVideoBlobURL = null; // 处理后视频的Blob URL
let animationFrameId = null; // 动画帧ID，用于取消正在进行的渲染

/**
 * 调整图片遮挡区域的大小，根据图片大小参数和图片宽高比计算合适的框尺寸
 * @param {number} areaIndex - 遮挡区域的索引
 * @param {number} imageSize - 图片大小参数（百分比）
 */
function adjustImageMosaicSize(areaIndex, imageSize) {
    if (areaIndex < 0 || areaIndex >= mosaicAreas.length) return;
    
    const area = mosaicAreas[areaIndex];
    if (area.type !== 'image' || !area.imageId || !uploadedImages[area.imageId]) return;
    
    // 获取图片信息
    const imageInfo = uploadedImages[area.imageId];
    
    // 更新视频容器信息
    updateVideoContainerRect();
    
    // 当前框的位置和大小
    const currentDisplayWidth = area.percentWidth * videoRect.width;
    const currentDisplayHeight = area.percentHeight * videoRect.height;
    const centerX = area.percentX * videoRect.width + currentDisplayWidth / 2;
    const centerY = area.percentY * videoRect.height + currentDisplayHeight / 2;
    
    // 计算新的图片原始尺寸（考虑imageSize参数）
    // 但要限制最大尺寸不超过视频本身的大小
    const maxPossibleWidth = videoPlayer.videoWidth;
    const maxPossibleHeight = videoPlayer.videoHeight;
    
    // 先计算基于imageSize的尺寸
    let scaledImageWidth = imageInfo.width * (imageSize / 100);
    let scaledImageHeight = imageInfo.height * (imageSize / 100);
    
    // 如果计算出的尺寸超过视频尺寸，限制为视频尺寸
    const imageRatio = imageInfo.width / imageInfo.height;
    
    if (scaledImageWidth > maxPossibleWidth) {
        scaledImageWidth = maxPossibleWidth;
        scaledImageHeight = scaledImageWidth / imageRatio;
    }
    
    if (scaledImageHeight > maxPossibleHeight) {
        scaledImageHeight = maxPossibleHeight;
        scaledImageWidth = scaledImageHeight * imageRatio;
    }
    
    // 计算新的框尺寸，确保能完整显示调整后的图片
    let newBoxWidth, newBoxHeight;
    
    // 计算框的尺寸，确保图片能完整显示在框内，同时保持宽高比
    if (imageRatio > (scaledImageWidth / scaledImageHeight)) {
        // 图片更宽，按宽度计算
        newBoxWidth = scaledImageWidth;
        newBoxHeight = scaledImageWidth / imageRatio;
    } else {
        // 图片更高，按高度计算
        newBoxHeight = scaledImageHeight;
        newBoxWidth = scaledImageHeight * imageRatio;
    }
    
    // 计算新的左上角位置
    let newX = centerX - newBoxWidth / 2;
    let newY = centerY - newBoxHeight / 2;
    
    // 添加边界检查，确保遮挡框不会超出视频容器
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + newBoxWidth > videoRect.width) {
        newX = videoRect.width - newBoxWidth;
    }
    if (newY + newBoxHeight > videoRect.height) {
        newY = videoRect.height - newBoxHeight;
    }
    
    // 更新遮挡区域的百分比位置和尺寸
    area.percentX = newX / videoRect.width;
    area.percentY = newY / videoRect.height;
    area.percentWidth = newBoxWidth / videoRect.width;
    area.percentHeight = newBoxHeight / videoRect.height;
    
    // 更新像素位置（用于后端处理）
    if (videoPlayer.videoWidth > 0 && videoPlayer.videoHeight > 0) {
        area.x = area.percentX * videoPlayer.videoWidth;
        area.y = area.percentY * videoPlayer.videoHeight;
        area.width = area.percentWidth * videoPlayer.videoWidth;
        area.height = area.percentHeight * videoPlayer.videoHeight;
    }
    
    // 更新图片大小参数
    area.imageSize = imageSize;
    
    // 更新显示
    updateMosaicBox();
    renderMosaicPreview();
}

// 拖拽相关变量
let isDragging = false;     // 是否正在拖拽
let isResizing = false;     // 是否正在调整大小
let currentHandle = null;   // 当前调整大小的控制点
let startX, startY, startWidth, startHeight;

// 水印数量限制
const MAX_MOSAIC_COUNT = 5; // 最大水印数量限制（所有类型组合）
const MAX_SINGLE_TYPE_COUNT = 2; // 单个类型最大水印数量限制

// 检查是否可以添加新水印（考虑单个类型限制和总数量限制）
function canAddWatermark(type) {
    console.log('canAddWatermark called with type:', type);
    console.log('Current mosaicAreas:', mosaicAreas);
    
    // 检查总数量限制
    if (mosaicAreas.length >= MAX_MOSAIC_COUNT) {
        console.log('Cannot add watermark: total count exceeded');
        return false;
    }
    
    // 直接为每个类型单独计数，彻底避免类型比较问题
    let textCount = 0;
    let mosaicCount = 0;
    let imageCount = 0;
    let blurCount = 0;
    
    // 遍历数组计数所有类型
    for (let i = 0; i < mosaicAreas.length; i++) {
        const area = mosaicAreas[i];
        if (area && area.type) {
            // 根据类型增加相应计数
            if (area.type === 'text') {
                textCount++;
            } else if (area.type === 'mosaic') {
                mosaicCount++;
            } else if (area.type === 'image') {
                imageCount++;
            } else if (area.type === 'blur') {
                blurCount++;
                console.log(`Found blur area at index ${i}:`, area);
            }
        }
    }
    
    // 打印所有类型的计数
    console.log('All type counts:');
    console.log('- text:', textCount);
    console.log('- mosaic:', mosaicCount);
    console.log('- image:', imageCount);
    console.log('- blur:', blurCount);
    
    // 根据传入的类型检查是否超过限制
    switch (type) {
        case 'text':
            if (textCount >= MAX_SINGLE_TYPE_COUNT) {
                console.log('Cannot add text watermark: count exceeded');
                return false;
            }
            break;
        case 'mosaic':
            if (mosaicCount >= MAX_SINGLE_TYPE_COUNT) {
                console.log('Cannot add mosaic watermark: count exceeded');
                return false;
            }
            break;
        case 'image':
            if (imageCount >= MAX_SINGLE_TYPE_COUNT) {
                console.log('Cannot add image watermark: count exceeded');
                return false;
            }
            break;
        case 'blur':
            if (blurCount >= MAX_SINGLE_TYPE_COUNT) {
                console.log('Cannot add blur watermark: count exceeded');
                return false;
            }
            break;
    }
    
    console.log('Can add watermark of type:', type);
    return true;
}

// 遮挡区域相关变量
let mosaicAreas = [];       // 存储所有遮挡区域
let currentMosaicIndex = -1; // 当前选中的遮挡区域索引
let uploadedImages = {};    // 存储上传的图片
let tempUploadedImage = null; // 临时存储用户在没有选中马赛克区域时上传的图片

// 初始化
function initApp() {
    // 隐藏设置和输出区域
    settingsSection.style.display = 'none';
    outputSection.style.display = 'none';
    
    // 禁用按钮
    applyMosaicBtn.disabled = true;
    removeAllBtn.disabled = true;
    downloadBtn.disabled = true;
    
    // 设置事件监听
    setupEventListeners();
    
    // 添加canvas点击事件监听器，用于选择不同的遮挡区域
    const canvas = document.getElementById('mosaic-canvas');
    if (canvas) {
        canvas.addEventListener('click', handleCanvasClick);
    }
}

// 更新视频容器信息
function updateVideoContainerRect() {
    // 设置最大尺寸限制
    const maxWidth = 800; // 最大宽度800px
    const maxHeight = 600; // 最大高度600px
    
    // 获取原始容器信息
    const containerRect = videoContainer.getBoundingClientRect();
    
    // 如果视频已加载，调整视频播放器尺寸以适应容器并保持比例
    if (videoPlayer.videoWidth > 0 && videoPlayer.videoHeight > 0) {
        // 计算视频原始宽高比
        const videoAspectRatio = videoPlayer.videoWidth / videoPlayer.videoHeight;
        
        // 计算可用空间（考虑容器宽度和最大限制）
        const availableWidth = Math.min(containerRect.width, maxWidth);
        const availableHeight = Math.min(containerRect.height, maxHeight);
        
        // 计算合适的显示尺寸，保持原始宽高比
        let displayWidth, displayHeight;
        if (videoAspectRatio >= availableWidth / availableHeight) {
            // 视频更宽或比例相同，按宽度缩放
            displayWidth = availableWidth;
            displayHeight = availableWidth / videoAspectRatio;
        } else {
            // 视频更高，按高度缩放
            displayHeight = availableHeight;
            displayWidth = availableHeight * videoAspectRatio;
        }
        
        // 设置视频播放器尺寸
        videoPlayer.style.width = `${displayWidth}px`;
        videoPlayer.style.height = `${displayHeight}px`;
        
        // 设置canvas尺寸与视频播放器一致
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
    }
    
    // 获取调整后的播放器信息
    const playerRect = videoPlayer.getBoundingClientRect();
    
    // 计算视频在容器内的相对位置
    videoRect = {
        left: playerRect.left - containerRect.left,
        top: playerRect.top - containerRect.top,
        width: playerRect.width,
        height: playerRect.height
    };
    
    // 重新计算视频比例
    if (videoPlayer.videoWidth > 0 && videoPlayer.videoHeight > 0) {
        const videoAspectRatio = videoPlayer.videoWidth / videoPlayer.videoHeight;
        const displayAspectRatio = playerRect.width / playerRect.height;
        
        if (videoAspectRatio > displayAspectRatio) {
            // 视频更宽，按宽度计算比例
            videoRatio = videoPlayer.videoWidth / playerRect.width;
        } else {
            // 视频更高，按高度计算比例
            videoRatio = videoPlayer.videoHeight / playerRect.height;
        }
    } else {
        videoRatio = 1;
    }
}

// 创建新的遮挡区域
function createMosaicArea() {
    updateVideoContainerRect();
    const initialSize = 150 / videoRatio; // 默认大小150px
    
    // 获取当前设置
    const type = mosaicTypeSelect.value;
    console.log('createMosaicArea - type from select:', type);
    console.log('createMosaicArea - mosaicTypeSelect.value:', mosaicTypeSelect.value);
    
    const mosaicSize = parseInt(mosaicSizeInput.value) || 10;
    const mosaicColor = mosaicColorInput.value || '#000000';
    const text = mosaicTextInput.value || '水印'; // 默认两个字
    const textSize = parseInt(mosaicTextSizeInput.value) || 40; // 增加默认文字大小使框更大
    const textColor = mosaicTextColorInput.value || '#000000';
    const scrollType = mosaicTextScrollInput ? mosaicTextScrollInput.value || 'fixed' : 'fixed';
    const scrollSpeed = mosaicTextScrollSpeedInput ? parseInt(mosaicTextScrollSpeedInput.value) || 50 : 50;
    const textOpacity = mosaicTextOpacityInput ? parseFloat(mosaicTextOpacityInput.value) || 1.0 : 1.0;
    const blurOpacity = blurOpacityInput ? parseFloat(blurOpacityInput.value) || 1.0 : 1.0;
    const startTime = startTimeInput ? parseFloat(startTimeInput.value) || 0 : 0;
    const endTime = endTimeInput ? parseFloat(endTimeInput.value) || videoDuration : videoDuration;
    const imageId = type === 'image' ? `image_${Date.now()}` : null;
    
    // 添加更多日志以确保类型值正确
    console.log('createMosaicArea - creating area with type:', type);
    // console.log('createMosaicArea - clickX:', clickX, 'clickY:', clickY);
    
    // 根据类型设置默认位置和大小
    // 统一使用视频内容区域的百分比坐标系
    // 先计算基于显示尺寸的百分比值
    let x, y, width, height, percentX, percentY, percentWidth, percentHeight;
    
    // 根据文字内容和大小调整初始大小，增加足够的内边距确保完全包裹文字
    if (type === 'text') {
        // 使用Canvas测量文字的实际宽度
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = `${textSize}px Arial`;
        const textWidth = tempCtx.measureText(text || '水印').width;
        
        // 计算显示尺寸，增加足够的内边距
        const padding = 10;
        const displayWidth = textWidth + padding * 2;
        const displayHeight = textSize * 1 + padding * 2;
        
        // 获取水印位置设置
        const position = mosaicTextPositionInput.value;
        
        // text-full情况需要特殊处理，因为它会修改displayWidth和displayHeight
        let { percentX, percentY } = calculateWatermarkPosition(position, displayWidth, displayHeight, videoRatio);
        
        // 如果是text-full，还需要调整宽高为视频容器的宽高
        if (position === 'text-full') {
            displayWidth = videoRect.width;
            displayHeight = videoRect.height;
        }
        
        // 计算百分比尺寸
        percentWidth = displayWidth / videoRect.width;
        percentHeight = displayHeight / videoRect.height;
        
        // 根据视频原始尺寸的百分比计算位置和尺寸（用于后端处理）
        x = videoPlayer.videoWidth * percentX;
        y = videoPlayer.videoHeight * percentY;
        width = videoPlayer.videoWidth * percentWidth;
        height = videoPlayer.videoHeight * percentHeight;
    } else if (type === 'image') {
        // 对于图片类型，使用imageSize参数来计算初始大小
        const imageSize = parseInt(imageSizeInput.value) || 100; // 获取图片大小参数
        let aspectRatio = 1; // 默认宽高比为1:1
        
        // 如果已经上传了图片，使用图片的实际宽高比
        if (tempUploadedImage) {
            aspectRatio = tempUploadedImage.width / tempUploadedImage.height;
        }
        
        // 强制更新视频容器矩形信息，确保居中计算正确
        updateVideoContainerRect();
        
        // 根据imageSize参数（百分比）和视频宽度计算基础宽度
        // 这里imageSize表示图片在视频中的显示大小百分比（范围5-25）
        let baseWidth = videoRect.width * (imageSize / 100);
        
        // 计算显示尺寸，但要限制最大尺寸不超过视频本身的大小
        let displayWidth = baseWidth;
        let displayHeight = baseWidth / aspectRatio;
        
        // 获取视频的实际尺寸
        const videoWidth = videoPlayer.videoWidth;
        const videoHeight = videoPlayer.videoHeight;
        
        // 如果计算出的尺寸超过视频尺寸，限制为视频尺寸
        if (displayWidth / videoRect.width * videoWidth > videoWidth) {
            displayWidth = videoRect.width;
            displayHeight = displayWidth / aspectRatio;
        }
        
        if (displayHeight / videoRect.height * videoHeight > videoHeight) {
            displayHeight = videoRect.height;
            displayWidth = displayHeight * aspectRatio;
        }
        
        // 获取水印位置设置
        const position = mosaicImagePositionInput.value;
        
        // text-full情况需要特殊处理，因为它会修改displayWidth和displayHeight
        let { percentX, percentY } = calculateWatermarkPosition(position, displayWidth, displayHeight, videoRatio);
        
        // 如果是text-full，还需要调整宽高为视频容器的宽高
        if (position === 'text-full') {
            displayWidth = videoRect.width;
            displayHeight = videoRect.height;
        }
        
        percentWidth = displayWidth / videoRect.width;
        percentHeight = displayHeight / videoRect.height;
        
        // 根据视频原始尺寸的百分比计算位置和尺寸（用于后端处理）
        x = videoPlayer.videoWidth * percentX;
        y = videoPlayer.videoHeight * percentY;
        width = videoPlayer.videoWidth * percentWidth;
        height = videoPlayer.videoHeight * percentHeight;
    } else {
        // 其他类型默认使用正方形
        // 计算显示尺寸
        const displayWidth = initialSize * videoRatio;
        const displayHeight = initialSize * videoRatio;
        
        // 默认居中
        percentX = 0.5 - displayWidth / (2 * videoRect.width); // 居中位置减去宽度一半的百分比
        percentY = 0.5 - displayHeight / (2 * videoRect.height); // 居中位置减去高度一半的百分比
        percentWidth = displayWidth / videoRect.width;
        percentHeight = displayHeight / videoRect.height;
        
        // 根据视频原始尺寸的百分比计算位置和尺寸（用于后端处理）
        x = videoPlayer.videoWidth * percentX;
        y = videoPlayer.videoHeight * percentY;
        width = videoPlayer.videoWidth * percentWidth;
        height = videoPlayer.videoHeight * percentHeight;
    }
    
    // 将原始视频尺寸坐标转换为显示尺寸坐标
    x = x / videoRatio;
    y = y / videoRatio;
    
    // 对所有类型都进行最终的边界检查，确保不会超出视频范围
    const maxX = videoRect.width - width;
    const maxY = videoRect.height - height;
    x = Math.max(0, Math.min(maxX, x));
    y = Math.max(0, Math.min(maxY, y));
    
    // 重新计算百分比位置（考虑边界限制后的实际位置）
    percentX = (x * videoRatio) / videoPlayer.videoWidth;
    percentY = (y * videoRatio) / videoPlayer.videoHeight;
    
    // 返回创建的遮挡区域对象，包含完整的百分比坐标系统信息
    const area = {
        x: x,
        y: y,
        width: width,
        height: height,
        percentX: percentX, // 存储相对于原始视频宽度的百分比位置
        percentY: percentY, // 存储相对于原始视频高度的百分比位置
        percentWidth: percentWidth,  // 新增：宽度百分比
        percentHeight: percentHeight, // 新增：高度百分比
        type: type,
        startTime: startTime,
        endTime: endTime,
        imageId: imageId
    };
    
    // 根据类型添加相应的属性
    if (type === 'mosaic') {
        area.mosaicSize = mosaicSize;
        area.mosaicColor = mosaicColor;
    } else if (type === 'blur') {
        area.blurSize = mosaicSize; // 复用马赛克大小输入框用于模糊大小
        area.blurOpacity = blurOpacity; // 添加模糊透明度属性
    } else if (type === 'text') {
        area.text = text;
        area.textSize = textSize;
        area.textColor = textColor;
        area.scrollType = scrollType;
        area.scrollSpeed = {
            horizontal: scrollSpeed,
            vertical: Math.round(scrollSpeed * 0.6) // 垂直滚动速度为水平的60%
        };
        area.textOpacity = textOpacity;
    } else if (type === 'image') {
        area.imageSize = parseInt(imageSizeInput.value) || 100; // 添加图片大小属性，默认100%
        area.imagePosition = mosaicImagePositionInput.value || 'left-top'; // 添加图片位置属性，默认左上角
        area.imageOpacity = parseFloat(mosaicImageOpacityInput.value) || 1.0; // 添加图片透明度属性，默认不透明
    }
    
    return area;
}

// 计算水印位置的公共函数
function calculateWatermarkPosition(position, displayWidth, displayHeight, videoRatio) {
    // 计算原始视频尺寸下的水印宽度和高度
    const originalWidth = displayWidth * videoRatio;
    const originalHeight = displayHeight * videoRatio;
    
    let percentX = 0.05;
    let percentY = 0.05;
    
    // 根据选择的位置设置不同的百分比坐标
    switch (position) {
        case 'left-top':
            percentX = 0.02; // 距离左边2%
            percentY = 0.02; // 距离顶边2%
            break;
        case 'left-bottom':
            percentX = 0.02;
            percentY = 0.98 - (originalHeight / videoPlayer.videoHeight);
            break;
        case 'right-top':
            percentX = 0.98 - (originalWidth / videoPlayer.videoWidth);
            percentY = 0.02;
            break;
        case 'right-bottom':
            percentX = 0.98 - (originalWidth / videoPlayer.videoWidth);
            percentY = 0.98 - (originalHeight / videoPlayer.videoHeight);
            break;
        case 'text-center':
            percentX = 0.5 - (originalWidth / (2 * videoPlayer.videoWidth));
            percentY = 0.5 - (originalHeight / (2 * videoPlayer.videoHeight));
            break;
        case 'top-center':
            percentX = 0.5 - (originalWidth / (2 * videoPlayer.videoWidth));
            percentY = 0.02;
            break;
        case 'bottom-center':
            percentX = 0.5 - (originalWidth / (2 * videoPlayer.videoWidth));
            percentY = 0.98 - (originalHeight / videoPlayer.videoHeight);
            break;
        case 'left-center':
            percentX = 0.02;
            percentY = 0.5 - (originalHeight / (2 * videoPlayer.videoHeight));
            break;
        case 'right-center':
            percentX = 0.98 - (originalWidth / videoPlayer.videoWidth);
            percentY = 0.5 - (originalHeight / (2 * videoPlayer.videoHeight));
            break;
        case 'text-full':
            // 铺满整个屏幕
            percentX = 0;
            percentY = 0;
            break;
        default:
            percentX = 0.05;
            percentY = 0.05;
    }
    
    return { percentX, percentY };
}

// 计算图片在给定矩形区域内的绘制位置
function calculateImageDrawPosition(position, x, y, width, height, drawWidth, drawHeight) {
    let drawX, drawY;
    
    switch (position) {
        case 'left-top':
            drawX = x;
            drawY = y;
            break;
        case 'left-bottom':
            drawX = x;
            drawY = y + (height - drawHeight);
            break;
        case 'right-top':
            drawX = x + (width - drawWidth);
            drawY = y;
            break;
        case 'right-bottom':
            drawX = x + (width - drawWidth);
            drawY = y + (height - drawHeight);
            break;
        case 'text-center':
        case 'move-other':
        default:
            // 默认居中
            drawX = x + (width - drawWidth) / 2;
            drawY = y + (height - drawHeight) / 2;
            break;
    }
    
    return { drawX, drawY };
}

// 更新马赛克区域信息
function updateMosaicArea(index, x, y, width, height, updatePercentCoordinates = true, updatePosition = false) {
    if (index >= 0 && index < mosaicAreas.length) {
        updateVideoContainerRect(); // 确保获取最新的视频容器信息
        const area = mosaicAreas[index];
        
        // 更新位置和大小
        if (x !== undefined) area.x = x;
        if (y !== undefined) area.y = y;
        if (width !== undefined) area.width = width;
        if (height !== undefined) area.height = height;
        
        // 对于文字类型，无论参数如何，都需要更新尺寸
        if (area.type === 'text') {
            const text = mosaicTextInput.value || '水印';
            const textSize = parseInt(mosaicTextSizeInput.value) || 40;
            
            // 使用Canvas测量文字的实际宽度，确保框大小准确
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.font = `${textSize}px Arial`;
            const textWidth = tempCtx.measureText(text || '水印').width;
            
            // 计算显示尺寸，添加足够的内边距
            const padding = 10;
            // 限制文字框的最大宽度为视频宽度的80%
            const maxDisplayWidth = videoRect.width * 0.8;
            const displayWidth = Math.min(textWidth + padding * 2, maxDisplayWidth);
            const displayHeight = textSize * 1 + padding * 2;
            
            // 根据视频原始尺寸的百分比计算宽度和高度（用于后端处理）
            const percentWidth = displayWidth / videoRect.width;
            const percentHeight = displayHeight / videoRect.height;
            
            // 设置准确的宽度和高度
            area.width = videoPlayer.videoWidth * percentWidth;
            area.height = videoPlayer.videoHeight * percentHeight;
            
            // 只有当updatePosition为true时，才根据选择的位置更新水印位置
            if (updatePosition) {
                // 获取水印位置设置
                const position = mosaicTextPositionInput.value;
                
                // 使用公共方法计算水印位置
                const { percentX, percentY } = calculateWatermarkPosition(position, displayWidth, displayHeight, videoRatio);
                
                // 特殊处理text-full情况
                if (position === 'text-full') {
                    // 铺满整个屏幕
                    percentX = 0;
                    percentY = 0;
                    displayWidth = videoRect.width;
                    displayHeight = videoRect.height;
                    // 重新计算宽度和高度
                    area.width = videoPlayer.videoWidth;
                    area.height = videoPlayer.videoHeight;
                }
                
                // 设置位置
                area.x = videoPlayer.videoWidth * percentX;
                area.y = videoPlayer.videoHeight * percentY;
            }
            
            // 更新百分比坐标和尺寸
            if (videoPlayer.videoWidth > 0 && videoPlayer.videoHeight > 0) {
                area.percentX = area.x / videoPlayer.videoWidth;
                area.percentY = area.y / videoPlayer.videoHeight;
                area.percentWidth = area.width / videoPlayer.videoWidth;
                area.percentHeight = area.height / videoPlayer.videoHeight;
            }
        }
    
    // 更新类型
    area.type = mosaicTypeSelect.value;
    
    // 更新时间设置（所有类型都需要）
    area.startTime = parseFloat(startTimeInput.value) || 0;
    area.endTime = parseFloat(endTimeInput.value) || videoDuration;
    
    // 根据类型更新相应的属性
    if (area.type === 'mosaic') {
        area.mosaicSize = parseInt(mosaicSizeInput.value) || 10;
        area.mosaicColor = mosaicColorInput.value || '#000000';
        // 移除不需要的属性
        delete area.blurSize;
        delete area.text;
        delete area.textSize;
        delete area.textColor;
        delete area.scrollType;
    } else if (area.type === 'blur') {
        area.blurSize = parseInt(mosaicSizeInput.value) || 10;
        area.blurOpacity = parseInt(blurOpacityInput.value) || 100;
        // 移除不需要的属性
        delete area.mosaicColor;
        delete area.text;
        delete area.textSize;
        delete area.textColor;
        delete area.scrollType;
    } else if (area.type === 'text') {
        // 保存原始位置（百分比或像素），确保在更新颜色时不会改变位置
        const originalPercentX = area.percentX;
        const originalPercentY = area.percentY;
        const originalX = area.x;
        const originalY = area.y;
        
        area.text = mosaicTextInput.value || '水印';
        area.textSize = parseInt(mosaicTextSizeInput.value) || 40;
        area.textColor = mosaicTextColorInput.value || '#000000';
        area.scrollType = mosaicTextScrollInput.value || 'fixed';
        // 移除不需要的属性
        delete area.mosaicSize;
        delete area.mosaicColor;
        delete area.blurSize;
        
        // 恢复原始位置，确保在更新颜色时不会改变位置
        if (originalPercentX !== undefined && originalPercentY !== undefined) {
            area.percentX = originalPercentX;
            area.percentY = originalPercentY;
        } else {
            area.x = originalX;
            area.y = originalY;
        }
    } else if (area.type === 'image') {
        area.imageSize = parseInt(imageSizeInput.value) || 100;
        area.imagePosition = mosaicImagePositionInput.value || 'left-top';
        area.imageOpacity = parseFloat(mosaicImageOpacityInput.value) || 1.0;
        // 移除不需要的属性
        delete area.mosaicSize;
        delete area.mosaicColor;
        delete area.blurSize;
        delete area.text;
        delete area.textSize;
        delete area.textColor;
        delete area.scrollType;
        
        // 如果切换到图片类型且没有图片ID，生成一个新的
        if (!area.imageId) {
            area.imageId = `image_${Date.now()}`;
        }
        
        // 重新计算当前图片的实际显示尺寸（考虑imageSize参数）
        let displayWidth, displayHeight;
        if (area.imageId && uploadedImages[area.imageId]) {
            const imageInfo = uploadedImages[area.imageId];
            const scaledImageWidth = imageInfo.width * (area.imageSize / 100);
            const scaledImageHeight = imageInfo.height * (area.imageSize / 100);
            const imageRatio = imageInfo.width / imageInfo.height;
            
            // 计算框的尺寸，确保图片能完整显示在框内，同时保持宽高比
            if (imageRatio > (scaledImageWidth / scaledImageHeight)) {
                // 图片更宽，按宽度计算
                displayWidth = scaledImageWidth;
                displayHeight = scaledImageWidth / imageRatio;
            } else {
                // 图片更高，按高度计算
                displayHeight = scaledImageHeight;
                displayWidth = scaledImageHeight * imageRatio;
            }
        } else {
            // 如果没有图片信息，使用当前的显示尺寸
            displayWidth = area.percentWidth * videoRect.width;
            displayHeight = area.percentHeight * videoRect.height;
        }
        
        // 更新图片的实际尺寸（考虑视频比例）
        area.width = displayWidth * videoRatio;
        area.height = displayHeight * videoRatio;
        
        // 只有当updatePosition为true时，才根据选择的位置更新水印位置
        if (updatePosition) {
            // 获取水印位置设置
            const position = area.imagePosition;
            
            // 根据选择的位置设置不同的百分比坐标
            let percentX, percentY;
            
            switch (position) {
                case 'left-top':
                    percentX = 0.02; // 距离左边2%
                    percentY = 0.02; // 距离顶边2%
                    break;
                case 'left-bottom':
                    percentX = 0.02;
                    percentY = 0.98 - (displayHeight / videoRect.height);
                    break;
                case 'right-top':
                    percentX = 0.98 - (displayWidth / videoRect.width);
                    percentY = 0.02;
                    break;
                case 'right-bottom':
                    percentX = 0.98 - (displayWidth / videoRect.width);
                    percentY = 0.98 - (displayHeight / videoRect.height);
                    break;
                case 'text-center':
                    percentX = 0.5 - (displayWidth / (2 * videoRect.width));
                    percentY = 0.5 - (displayHeight / (2 * videoRect.height));
                    break;
                case 'top-center':
                    percentX = 0.5 - (displayWidth / (2 * videoRect.width));
                    percentY = 0.02;
                    break;
                case 'bottom-center':
                    percentX = 0.5 - (displayWidth / (2 * videoRect.width));
                    percentY = 0.98 - (displayHeight / videoRect.height);
                    break;
                case 'left-center':
                    percentX = 0.02;
                    percentY = 0.5 - (displayHeight / (2 * videoRect.height));
                    break;
                case 'right-center':
                    percentX = 0.98 - (displayWidth / videoRect.width);
                    percentY = 0.5 - (displayHeight / (2 * videoRect.height));
                    break;
                case 'move-other':
                    // 保持当前位置不变
                    return;
                default:
                    percentX = 0.02;
                    percentY = 0.02;
            }
            
            // 设置位置
            area.x = videoPlayer.videoWidth * percentX;
            area.y = videoPlayer.videoHeight * percentY;
            
            // 更新百分比位置
            area.percentX = percentX;
            area.percentY = percentY;
        }
    }
    
    // 对于非文字类型，如果更新了尺寸且允许更新百分比坐标，则更新百分比尺寸
    if (area.type !== 'text' && updatePercentCoordinates && width !== undefined && height !== undefined) {
        if (videoPlayer.videoWidth > 0 && videoPlayer.videoHeight > 0) {
            area.percentWidth = area.width / videoPlayer.videoWidth;
            area.percentHeight = area.height / videoPlayer.videoHeight;
        }
    }
    
    // 添加边界检查，确保区域不会超出视频范围
    const displayWidth = area.width / videoRatio;
    const displayHeight = area.height / videoRatio;
    const maxX = videoRect.width - displayWidth;
    const maxY = videoRect.height - displayHeight;
    
    // 转换回原始比例并应用边界限制
    area.x = Math.max(0, Math.min(maxX * videoRatio, area.x));
    area.y = Math.max(0, Math.min(maxY * videoRatio, area.y));
    
    // 只在需要时更新百分比位置，避免拖动结束后位置跳动
    if (updatePercentCoordinates && videoPlayer.videoWidth > 0 && videoPlayer.videoHeight > 0) {
        area.percentX = area.x / videoPlayer.videoWidth;
        area.percentY = area.y / videoPlayer.videoHeight;
    }
    }
}

// 更新马赛克框显示
function updateMosaicBox() {
    if (!videoRect || currentMosaicIndex < 0) {
        mosaicBox.classList.remove('active');
        mosaicBox.classList.remove('text-type');
        mosaicBox.innerHTML = '';
        return;
    }
    
    const area = mosaicAreas[currentMosaicIndex];
    
    // 统一使用视频内容区域坐标系
    let x, y, width, height;
    
    if (area.percentX !== undefined && area.percentY !== undefined && area.percentWidth !== undefined && area.percentHeight !== undefined) {
        // 使用百分比坐标系统（推荐）
        x = videoRect.width * area.percentX;
        y = videoRect.height * area.percentY;
        width = videoRect.width * area.percentWidth;
        height = videoRect.height * area.percentHeight;
    } else if (area.percentX !== undefined && area.percentY !== undefined) {
        // 兼容只有位置百分比的情况
        x = videoRect.width * area.percentX;
        y = videoRect.height * area.percentY;
        // 计算显示尺寸
        width = area.width / videoRatio;
        height = area.height / videoRatio;
    } else {
        // 兼容旧数据，使用原始方式
        x = area.x / videoRatio;
        y = area.y / videoRatio;
        width = area.width / videoRatio;
        height = area.height / videoRatio;
    }
    
    // 更新样式
    mosaicBox.style.left = `${videoRect.left + x}px`;
    mosaicBox.style.top = `${videoRect.top + y}px`;
    mosaicBox.style.width = `${width}px`;
    mosaicBox.style.height = `${height}px`;
    mosaicBox.classList.add('active');
    
    // 根据遮挡区域类型添加相应的CSS类
    if (area.type === 'text') {
        mosaicBox.classList.add('text-type');
        // 清空innerHTML，避免DOM文字与Canvas绘制的文字叠加导致模糊
        // 仅通过Canvas显示文字，确保单一来源
        mosaicBox.innerHTML = '';
    } else {
        mosaicBox.classList.remove('text-type');
        // 对于非文字类型（包括图片），添加调整大小的控制点
        mosaicBox.innerHTML = `
            <div class="mosaic-handle top-left"></div>
            <div class="mosaic-handle top-right"></div>
            <div class="mosaic-handle bottom-left"></div>
            <div class="mosaic-handle bottom-right"></div>
        `;
        
        // 为新添加的控制点绑定事件
        const handles = mosaicBox.querySelectorAll('.mosaic-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', handleResizeHandleMouseDown);
        });
    }
}

// 实时渲染遮挡效果预览
function renderMosaicPreview() {
    if (!videoPlayer.src || !videoRect) return;
    
    // 清空Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制当前视频帧到Canvas
    ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
    
    // 绘制所有遮挡区域 - 预览模式下忽略时间判断，确保所有水印都能实时显示
    mosaicAreas.forEach(area => {
        // 统一使用视频内容区域坐标系
        let x, y, width, height;
            
            if (area.percentX !== undefined && area.percentY !== undefined && area.percentWidth !== undefined && area.percentHeight !== undefined) {
                // 使用百分比坐标系统（推荐）
                x = canvas.width * area.percentX;
                y = canvas.height * area.percentY;
                width = canvas.width * area.percentWidth;
                height = canvas.height * area.percentHeight;
            } else if (area.percentX !== undefined && area.percentY !== undefined) {
                // 兼容只有位置百分比的情况
                x = canvas.width * area.percentX;
                y = canvas.height * area.percentY;
                // 计算显示尺寸
                width = area.width / videoRatio;
                height = area.height / videoRatio;
            } else {
                // 兼容旧数据，使用原始方式
                x = area.x / videoRatio;
                y = area.y / videoRatio;
                width = area.width / videoRatio;
                height = area.height / videoRatio;
            }
            
            // 根据遮挡类型调用不同的绘制函数
            switch (area.type) {
                case 'mosaic':
                    drawMosaic(ctx, x, y, width, height, area.mosaicSize, area.mosaicColor);
                    break;
                case 'blur':
                    drawBlur(ctx, x, y, width, height, area.blurSize || 10, area.blurOpacity || 100);
                    break;
                case 'text':
                    drawText(ctx, x, y, width, height, area.text, area.textSize, area.textColor, area.scrollType || 'fixed', area.scrollSpeed, area.textOpacity || 1.0, videoPlayer.currentTime);
                    break;
                case 'image':
                    drawImage(ctx, x, y, width, height, area.imageId, area.imageSize || 100, area.imagePosition || 'left-top', area.imageOpacity || 1.0);
                    break;
            }
    });
}

// 绘制马赛克效果
function drawMosaic(ctx, x, y, width, height, mosaicSize, color) {
    ctx.save();
    
    // 防御性检查：确保宽度和高度都是正数
    if (width <= 0 || height <= 0) {
        ctx.restore();
        return;
    }
    
    // 创建马赛克效果
    const blockSize = mosaicSize;
    
    for (let i = 0; i < width; i += blockSize) {
        for (let j = 0; j < height; j += blockSize) {
            const blockWidth = Math.min(blockSize, width - i);
            const blockHeight = Math.min(blockSize, height - j);
            
            // 确保块的宽度和高度都是正数
            if (blockWidth <= 0 || blockHeight <= 0) continue;
            
            // 获取像素数据来确定颜色
            const imageData = ctx.getImageData(x + i, y + j, blockWidth, blockHeight);
            const data = imageData.data;
            let r = 0, g = 0, b = 0;
            let pixelCount = 0;
            
            for (let k = 0; k < data.length; k += 4) {
                r += data[k];
                g += data[k + 1];
                b += data[k + 2];
                pixelCount++;
            }
            
            // 使用选择的颜色和像素平均值的透明度
            ctx.fillStyle = color;
            ctx.fillRect(x + i, y + j, blockWidth, blockHeight);
        }
    }
    
    ctx.restore();
}

// 绘制模糊效果
function drawBlur(ctx, x, y, width, height, blurSize, blurOpacity = 100) {
    ctx.save();
    
    // 防御性检查：确保宽度和高度都是正数
    if (width <= 0 || height <= 0) {
        ctx.restore();
        return;
    }
    
    try {
        // 创建临时Canvas用于应用模糊滤镜，使用与目标区域相同的大小
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        // 复制当前区域到临时Canvas
        tempCtx.drawImage(ctx.canvas, x, y, width, height, 0, 0, width, height);
        
        // 应用模糊滤镜
        tempCtx.filter = `blur(${blurSize}px)`;
        
        // 在临时Canvas上重新绘制自己，应用模糊效果
        tempCtx.drawImage(tempCanvas, 0, 0);
        
        // 先清除目标区域
        ctx.clearRect(x, y, width, height);
        
        // 获取透明度值
        const opacity = blurOpacity / 100;
        
        // 设置透明度
        ctx.globalAlpha = opacity;
        
        // 将模糊后的内容绘制回原图的目标区域
        ctx.drawImage(tempCanvas, 0, 0, width, height, x, y, width, height);
        
        // 重置滤镜和透明度
        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;
    } catch (error) {
        console.error('模糊效果处理失败:', error);
        // 备用方案：使用半透明灰色覆盖
        const opacity = blurOpacity / 100;
        ctx.fillStyle = `rgba(128, 128, 128, ${0.8 * opacity})`;
        ctx.fillRect(x, y, width, height);
    }
    
    ctx.restore();
}

// 绘制文字效果 - 同时支持DOM显示和Canvas绘制，确保视频处理时能正确应用
// 添加currentTime参数，确保预览和下载时使用相同的时间基准
function drawText(ctx, x, y, width, height, text, textSize, textColor, scrollType = 'fixed', scrollSpeed = {horizontal: 50, vertical: 30}, textOpacity = 1.0, currentTime = videoPlayer.currentTime) {
    console.log('Drawing text:', text, 'at position:', x, y, 'with size:', textSize, 'and color:', textColor, 'scroll:', scrollType);
    
    // 防御性检查：确保宽度和高度都是正数
    if (width <= 0 || height <= 0) {
        return;
    }
    
    // 实际在Canvas上绘制文字，这对视频处理至关重要
    ctx.save();
    ctx.font = `${textSize}px Arial`;
    ctx.fillStyle = textColor || '#000000';
    ctx.globalAlpha = textOpacity;
    
    // 获取当前上下文的画布尺寸，确保使用正确的尺寸进行计算
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    // 计算缩放比例，确保在不同尺寸的Canvas上保持一致的视觉滚动速度
    // 预览Canvas的尺寸（用于计算滚动速度的基准）
    const previewCanvasWidth = canvas.width;
    const previewCanvasHeight = canvas.height;
    
    // 计算当前Canvas与预览Canvas的尺寸比例
    const scaleRatioX = previewCanvasWidth > 0 ? canvasWidth / previewCanvasWidth : 1;
    const scaleRatioY = previewCanvasHeight > 0 ? canvasHeight / previewCanvasHeight : 1;
    
    // 检查是否为铺满整个屏幕的45度水印模式
    // 更宽松的检测条件：只要宽度或高度接近屏幕尺寸即可
    const isFullScreen = width >= canvasWidth * 0.9 || height >= canvasHeight * 0.9;
    
    if (isFullScreen) {
        // 45度角铺满整个屏幕的水印效果
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        // 计算水印间距
        const textWidth = ctx.measureText(text || '水印').width;
        const spacing = Math.max(textWidth, textSize) * 1.5;
        
        // 计算对角线长度，确保覆盖整个屏幕
        const diagonal = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
        
        // 设置45度旋转
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.rotate(Math.PI / 4);
        ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
        
        // 绘制多行水印
        for (let i = -diagonal / 2; i < diagonal / 2; i += spacing) {
            for (let j = -diagonal / 2; j < diagonal / 2; j += spacing) {
                ctx.fillText(text || '水印', canvasWidth / 2 + i, canvasHeight / 2 + j);
            }
        }
    } else {
        // 普通文字水印模式
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        
        // 添加适当的内边距，确保文字不会紧贴边框
        const padding = 10;
        
        // 计算文字宽度
        const fullText = text || '水印';
        let displayText = fullText;
        let textWidth = ctx.measureText(fullText).width;
        
        // 检查文字是否超过视频长度的90%
        const maxTextWidth = canvasWidth * 0.9;
        
        // 只有在固定位置（非滚动）且文字宽度超过视频长度90%时才显示省略号
        if (scrollType === 'fixed' && textWidth > maxTextWidth) {
            // 截断文字并添加省略号
            let truncatedText = fullText;
            while (ctx.measureText(truncatedText + '...').width > maxTextWidth && truncatedText.length > 1) {
                truncatedText = truncatedText.slice(0, -1);
            }
            displayText = truncatedText + '...';
            textWidth = ctx.measureText(displayText).width;
        }
        
        // 根据滚动类型计算实际位置
        let drawX = x + padding;
        let drawY = y + padding;
        
        if (scrollType === 'horizontal' && currentTime !== undefined) {
            // 水平滚动 - 从右向左
            const currentScrollSpeed = scrollSpeed.horizontal || 50; // 滚动速度
            
            // 计算基准偏移量（基于预览Canvas尺寸）
            const baseScrollOffset = (currentTime * currentScrollSpeed) % (previewCanvasWidth + textWidth);
            
            // 根据缩放比例调整偏移量，确保在不同尺寸的Canvas上保持一致的视觉滚动速度
            const scrollOffset = baseScrollOffset * scaleRatioX;
            
            // 确保在视频未播放时(currentTime=0)，文字从画布右侧边缘开始进入
            // 当currentTime=0时，scrollOffset=0，此时文字应该部分可见
            if (scrollOffset === 0 && currentTime === 0) {
                // 当视频未播放时，让文字从画布右侧开始进入，显示部分文字
                drawX = canvasWidth - textWidth / 2;
            } else {
                // 正常滚动逻辑
                drawX = canvasWidth - scrollOffset + padding;
            }
        } else if (scrollType === 'vertical' && currentTime !== undefined) {
            // 垂直滚动 - 从上向下
            const currentScrollSpeed = scrollSpeed.vertical || 30; // 滚动速度
            
            // 计算基准偏移量（基于预览Canvas尺寸）
            const baseScrollOffset = (currentTime * currentScrollSpeed) % (previewCanvasHeight + textSize);
            
            // 根据缩放比例调整偏移量，确保在不同尺寸的Canvas上保持一致的视觉滚动速度
            const scrollOffset = baseScrollOffset * scaleRatioY;
            
            // 确保在视频未播放时，文字在画布内可见
            drawY = scrollOffset + padding;
        }
        
        // 在指定位置绘制文字，添加一点内边距
        // 滚动时显示完整文字，固定时显示截断文字
        const textToDraw = scrollType === 'fixed' ? displayText : fullText;
        ctx.fillText(textToDraw, drawX, drawY);
        
        // 对于水平滚动，如果文字开始离开屏幕左侧，在右侧继续绘制，形成循环效果
        if (scrollType === 'horizontal' && drawX < -textWidth) {
            ctx.fillText(fullText, drawX + canvasWidth, drawY);
        } else if (scrollType === 'vertical' && drawY > canvasHeight) {
            // 对于垂直滚动，如果文字完全离开屏幕底部，在顶部继续绘制
            ctx.fillText(fullText, drawX, drawY - canvasHeight);
        }
    }
    
    ctx.restore();
}

// 绘制图片效果
function drawImage(ctx, x, y, width, height, imageId, imageSize = 100, position = 'left-top', opacity = 1.0) {
    ctx.save();
    
    // 防御性检查：确保宽度和高度都是正数
    if (width <= 0 || height <= 0) {
        ctx.restore();
        return;
    }
    
    // 设置透明度
    ctx.globalAlpha = opacity;
    
    const imageInfo = uploadedImages[imageId];
    // 检查图片是否存在，支持两种存储格式：直接存储Image对象或包含element属性的对象
    const image = imageInfo && (imageInfo.element || imageInfo);
    if (image && (image.complete || imageInfo.width)) {
        // 计算图片缩放比例
        const imgRatio = imageInfo.aspectRatio || imageInfo.width / imageInfo.height || image.width / image.height;
        let drawWidth, drawHeight, drawX, drawY;
        
        // 根据遮挡框的大小和图片的宽高比，计算合适的图片尺寸
        // 确保图片能够完整地填充遮挡框，同时保持原始的宽高比
        // imageSize参数已经在createMosaicArea函数中用于计算遮挡框的大小
        let scaledWidth, scaledHeight;
        
        // 计算图片尺寸，使其完全填充遮挡框并保持宽高比
        if (imgRatio > width / height) {
            // 图片比框更宽，以框的宽度为基准缩放
            drawWidth = width;
            drawHeight = width / imgRatio;
        } else {
            // 图片比框更高，以框的高度为基准缩放
            drawHeight = height;
            drawWidth = height * imgRatio;
        }
        
        // 使用公共方法计算图片在遮挡框内的绘制位置
        const positionResult = calculateImageDrawPosition(position, x, y, width, height, drawWidth, drawHeight);
        drawX = positionResult.drawX;
        drawY = positionResult.drawY;
        
        // 添加边界检查，确保图片不会超出画布范围
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // 调整X坐标
        if (drawX < 0) {
            drawX = 0;
        } else if (drawX + drawWidth > canvasWidth) {
            drawX = canvasWidth - drawWidth;
        }
        
        // 调整Y坐标
        if (drawY < 0) {
            drawY = 0;
        } else if (drawY + drawHeight > canvasHeight) {
            drawY = canvasHeight - drawHeight;
        }
        
        // 绘制图片
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        
        // 对于主预览画布，当图片被缩减时，确保框的大小与显示的图片大小一致
        if (ctx.canvas.id === 'mosaicPreview' && currentMosaicIndex >= 0) {
            // 获取当前马赛克区域
            const currentArea = mosaicAreas[currentMosaicIndex];
            
            // 检查当前操作的是否为图片类型，并且图片ID匹配
            if (currentArea.type === 'image' && currentArea.imageId === imageId) {
                // 检查当前显示的图片尺寸是否与框尺寸不同
                const currentDisplayWidth = currentArea.percentWidth * videoRect.width;
                const currentDisplayHeight = currentArea.percentHeight * videoRect.height;
                
                // 计算实际显示的图片部分的尺寸（考虑到裁剪）
                const visibleDrawWidth = Math.min(drawWidth, currentDisplayWidth + 2 * (x - drawX));
                const visibleDrawHeight = Math.min(drawHeight, currentDisplayHeight + 2 * (y - drawY));
                
                // 如果显示的图片尺寸与框尺寸差异超过阈值，则调整框大小
                if (Math.abs(visibleDrawWidth - currentDisplayWidth) > 1 || Math.abs(visibleDrawHeight - currentDisplayHeight) > 1) {
                    // 使用setTimeout避免在绘制过程中修改状态
                    setTimeout(() => {
                        // 计算新的中心点，保持图片居中
                        const centerX = x + currentDisplayWidth / 2;
                        const centerY = y + currentDisplayHeight / 2;
                        
                        // 计算新的x和y坐标
                        const newX = centerX - visibleDrawWidth / 2;
                        const newY = centerY - visibleDrawHeight / 2;
                        
                        // 更新马赛克区域，确保框与图片大小保持一致
                        updateMosaicArea(currentMosaicIndex, 
                            newX, 
                            newY, 
                            visibleDrawWidth,
                            visibleDrawHeight,
                            false // 不更新百分比坐标
                        );
                        
                        // 更新显示
                        updateMosaicBox();
                    }, 0);
                }
            }
        }
    } else {
        // 图片未加载或不存在，显示占位符
        ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
        ctx.fillRect(x, y, width, height);
        
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('图片未上传', x + width / 2, y + height / 2);
    }
    
    ctx.restore();
}

// 文本换行函数
function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    
    return lines;
}

// 初始化马赛克框
function initializeMosaicBox() {
    // 创建调整大小的控制点
    if (mosaicBox.children.length === 0) {
        const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        handles.forEach(position => {
            const handle = document.createElement('div');
            handle.className = `mosaic-handle ${position}`;
            mosaicBox.appendChild(handle);
        });
        
        // 添加点击事件监听器，确保单击时移动框位置被固定
        mosaicBox.addEventListener('click', (e) => {
            // 防止点击调整大小的控制点时触发
            if (e.target.className.includes('mosaic-handle') || currentMosaicIndex < 0) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // 确保移动框位置正确更新和固定
            updateMosaicBox();
            renderMosaicPreview();
        });
    }
    
    // 隐藏马赛克框，直到添加遮挡区域
    mosaicBox.classList.remove('active');
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 防抖版的预览渲染函数
const debouncedRenderMosaicPreview = debounce(() => {
    renderMosaicPreview();
}, 16); // 约60fps

// 清理拖拽事件监听器
function cleanupDragEvents() {
    // 移除可能存在的全局事件监听器
    document.removeEventListener('mousemove', onMouseDragMove);
    document.removeEventListener('mouseup', onMouseDragUp);
    document.removeEventListener('mousemove', onResizeDragMove);
    document.removeEventListener('mouseup', onResizeDragUp);
    
    // 重置拖拽状态
    isDragging = false;
    isResizing = false;
    currentHandle = null;
}

// 优化的拖拽移动处理
let onMouseDragMove = (e) => {
    // 首先检查是否有有效的马赛克区域
    if (currentMosaicIndex < 0) return;
    
    // 检查拖动距离是否超过阈值
    const dragDistanceX = Math.abs(e.clientX - initialMouseX);
    const dragDistanceY = Math.abs(e.clientY - initialMouseY);
    
    // 只有当真正开始拖动时，才设置拖动状态并阻止默认事件
    if (!isDragging) {
        // 如果距离小于阈值，则不执行拖动逻辑
        if (dragDistanceX < DRAG_THRESHOLD && dragDistanceY < DRAG_THRESHOLD) {
            return;
        }
        
        isDragging = true;
        isResizing = false; // 确保不同时处于调整大小状态
    }
    
    e.preventDefault();
    
    // 拖动过程中视频容器尺寸通常不会改变，减少不必要的计算
    // 只有在必要时才更新videoRect
    if (!videoRect || videoRect.width === 0 || videoRect.height === 0) {
        updateVideoContainerRect();
    }
    
    const containerRect = videoContainer.getBoundingClientRect();
    const updatedArea = mosaicAreas[currentMosaicIndex];
    
    // 精确计算鼠标在视频内容区域中的位置
    const mouseXInVideoArea = e.clientX - containerRect.left - videoRect.left;
    const mouseYInVideoArea = e.clientY - containerRect.top - videoRect.top;
    
    // 计算水印框的显示尺寸
    const displayWidth = updatedArea.percentWidth * videoRect.width;
    const displayHeight = updatedArea.percentHeight * videoRect.height;
    
    // 直接基于鼠标位置和初始偏移量计算新的中心点，确保光标位置与水印相对位置一致
    let newCenterX = mouseXInVideoArea - startX;
    let newCenterY = mouseYInVideoArea - startY;
    
    // 计算新的左上角位置
    let newX = newCenterX - displayWidth / 2;
    let newY = newCenterY - displayHeight / 2;
    
    // 限制在视频范围内
    const maxX = videoRect.width - displayWidth;
    const maxY = videoRect.height - displayHeight;
    newX = Math.max(0, Math.min(maxX, newX));
    newY = Math.max(0, Math.min(maxY, newY));
    
    // 更新百分比坐标
    updatedArea.percentX = newX / videoRect.width;
    updatedArea.percentY = newY / videoRect.height;
    
    // 拖动过程中只更新显示，减少计算密集型操作
    updateMosaicBox();
    
    // 使用requestAnimationFrame优化渲染性能
requestAnimationFrame(renderMosaicPreview);
    
    // 更新对应的输入框值，确保手动拖动时输入框也会同步变化
    const currentArea = mosaicAreas[currentMosaicIndex];
    if (currentArea && currentArea.type === 'image') {
        // 使用当前值或默认值（100）更新图片大小百分比输入框
        const currentImageSize = currentArea.imageSize || 100;
        if (imageSizeInput.value !== currentImageSize) {
            imageSizeInput.value = currentImageSize;
        }
    }
};

// 定义变量用于拖动距离阈值判断
let initialMouseX = 0;
let initialMouseY = 0;
const DRAG_THRESHOLD = 5; // 拖动阈值，超过这个像素距离才认为是拖动操作

// 修改onMouseDragUp函数，确保拖动结束后水印不会消失
let onMouseDragUp = (e) => {
    // 保存当前马赛克索引
    const savedMosaicIndex = currentMosaicIndex;
    
    // 保存当前状态标志
    const wasDragging = isDragging;
    
    // 立即重置拖动状态，确保点击不会继续触发拖动
    isDragging = false;
    isResizing = false;
    currentHandle = null;
    
    // 不再需要检查当前Ctrl键状态，因为我们使用isCtrlPressed来跟踪拖动过程中的Ctrl键状态
    
    // 确保savedMosaicIndex仍然有效
    if (savedMosaicIndex >= 0 && savedMosaicIndex < mosaicAreas.length) {
        // 确保currentMosaicIndex保持不变
        currentMosaicIndex = savedMosaicIndex;
        
        // 直接更新显示
        updateMosaicBox();
        
        // 如果是点击操作（没有拖动），确保位置被正确固定
        if (!wasDragging) {
            // 检查拖动距离是否小于阈值（确认是点击而非拖动）
            const dragDistanceX = Math.abs(e.clientX - initialMouseX);
            const dragDistanceY = Math.abs(e.clientY - initialMouseY);
            
            if (dragDistanceX < DRAG_THRESHOLD && dragDistanceY < DRAG_THRESHOLD) {
                // 这是一个点击操作，确保位置被正确固定
                updateMosaicBox();
                renderMosaicPreview();
            }
        }
        
        // 异步更新像素位置（用于后端处理）
        const updatedArea = mosaicAreas[savedMosaicIndex];
        if (videoPlayer.videoWidth > 0 && videoPlayer.videoHeight > 0) {
            setTimeout(() => {
                const pixelX = updatedArea.percentX * videoPlayer.videoWidth;
                const pixelY = updatedArea.percentY * videoPlayer.videoHeight;
                const pixelWidth = updatedArea.percentWidth * videoPlayer.videoWidth;
                const pixelHeight = updatedArea.percentHeight * videoPlayer.videoHeight;
                updateMosaicArea(savedMosaicIndex, pixelX, pixelY, pixelWidth, pixelHeight, false);
                
                // 确保在异步更新后再次渲染，以保证显示的一致性
                setTimeout(() => {
                    if (currentMosaicIndex === savedMosaicIndex) {
                        updateMosaicBox();
                        renderMosaicPreview();
                        
                        // 只有当真正拖动了水印时，才更新位置选择器为'其他'
                        if (wasDragging) {
                            const area = mosaicAreas[currentMosaicIndex];
                            if (area.type === 'text' && mosaicTextPositionInput) {
                                mosaicTextPositionInput.value = 'move-other';
                            } else if (area.type === 'image' && mosaicImagePositionInput) {
                                mosaicImagePositionInput.value = 'move-other';
                            }
                        }
                    }
                }, 0);
            }, 0);
        }
    }
    
    // 确保最终渲染一次
    renderMosaicPreview();
    
    // 清理事件监听器，但不重置currentMosaicIndex
    document.removeEventListener('mousemove', onMouseDragMove);
    document.removeEventListener('mouseup', onMouseDragUp);
    document.removeEventListener('mousemove', onResizeDragMove);
    document.removeEventListener('mouseup', onResizeDragUp);
    
    // 确保mosaicBox保持active状态
    if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
        mosaicBox.classList.add('active');
    }
};

// 注意：已在上面定义了优化版本的onMouseDragUp函数
// 此注释仅用于说明，不再重复定义函数

// 调整大小处理
let onResizeDragMove = (e) => {
    // 确保只有在按住鼠标并且有有效的调整大小状态时才执行
    if (!isResizing || !currentHandle || currentMosaicIndex < 0) return;
    
    e.preventDefault();
    updateVideoContainerRect();
    
    const containerRect = videoContainer.getBoundingClientRect();
    const updatedArea = mosaicAreas[currentMosaicIndex];
    
    // 转换为基于视频内容区域的坐标
    let x = updatedArea.percentX * videoRect.width;
    let y = updatedArea.percentY * videoRect.height;
    let width = updatedArea.percentWidth * videoRect.width;
    let height = updatedArea.percentHeight * videoRect.height;
    
    // 对于文字类型，移除最小尺寸限制；对于其他类型，保持最小尺寸
    const isTextType = updatedArea.type === 'text';
    const minSize = isTextType ? 10 : 50; // 直接使用像素值
    
    // 计算当前鼠标在视频内容区域中的位置（从videoRect的左上角开始计算）
    const mouseX = e.clientX - containerRect.left - videoRect.left;
    const mouseY = e.clientY - containerRect.top - videoRect.top;
    
    // 根据控制点位置调整大小
    switch (currentHandle) {
        case 'top-right':
            width = Math.max(minSize, mouseX - x);
            height = Math.max(minSize, height + (y - mouseY));
            y = Math.max(0, mouseY);
            break;
        case 'bottom-right':
            width = Math.max(minSize, mouseX - x);
            height = Math.max(minSize, mouseY - y);
            break;
        case 'bottom-left':
            width = Math.max(minSize, width + (x - mouseX));
            height = Math.max(minSize, mouseY - y);
            x = Math.max(0, mouseX);
            break;
        case 'top-left':
            width = Math.max(minSize, width + (x - mouseX));
            height = Math.max(minSize, height + (y - mouseY));
            x = Math.max(0, mouseX);
            y = Math.max(0, mouseY);
            break;
    }
    
    // 如果是图片类型，保持图片宽高比并限制最大尺寸不超过视频本身
    if (updatedArea.type === 'image' && updatedArea.imageId && uploadedImages[updatedArea.imageId]) {
        const imageInfo = uploadedImages[updatedArea.imageId];
        const aspectRatio = imageInfo.aspectRatio || 1;
        
        // 根据鼠标拖动的方向，决定保持宽度或高度不变
        // 这是一个简单的判断方式，实际可以更复杂地判断用户意图
        const isHorizontalResize = currentHandle.includes('left') || currentHandle.includes('right');
        const isVerticalResize = currentHandle.includes('top') || currentHandle.includes('bottom');
        
        if (isHorizontalResize && isVerticalResize) {
            // 如果同时调整宽高（如角落控制点），默认保持宽度不变，调整高度
            height = width / aspectRatio;
        } else if (isHorizontalResize) {
            // 仅水平调整，根据宽度计算高度
            height = width / aspectRatio;
        } else if (isVerticalResize) {
            // 仅垂直调整，根据高度计算宽度
            width = height * aspectRatio;
        }
        
        // 确保最小尺寸
        if (height < minSize) {
            height = minSize;
            width = height * aspectRatio;
        }
        
        if (width < minSize) {
            width = minSize;
            height = width / aspectRatio;
        }
        
        // 限制最大尺寸不超过视频本身
        const maxPossibleWidth = videoRect.width;
        const maxPossibleHeight = videoRect.height;
        
        if (width > maxPossibleWidth) {
            width = maxPossibleWidth;
            height = width / aspectRatio;
        }
        
        if (height > maxPossibleHeight) {
            height = maxPossibleHeight;
            width = height * aspectRatio;
        }
    }
    
    // 确保不超出视频范围
    const maxX = videoRect.width - width;
    const maxY = videoRect.height - height;
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    
    // 统一使用视频内容区域的百分比坐标系
    updatedArea.percentX = x / videoRect.width;
    updatedArea.percentY = y / videoRect.height;
    updatedArea.percentWidth = width / videoRect.width;
    updatedArea.percentHeight = height / videoRect.height;
    
    // 基于百分比位置和尺寸更新像素位置（用于后端处理）
    // 传入updatePercentCoordinates=false参数，确保调整大小时不会重置位置
    if (videoPlayer.videoWidth > 0 && videoPlayer.videoHeight > 0) {
        const pixelX = updatedArea.percentX * videoPlayer.videoWidth;
        const pixelY = updatedArea.percentY * videoPlayer.videoHeight;
        const pixelWidth = updatedArea.percentWidth * videoPlayer.videoWidth;
        const pixelHeight = updatedArea.percentHeight * videoPlayer.videoHeight;
        updateMosaicArea(currentMosaicIndex, pixelX, pixelY, pixelWidth, pixelHeight, false);
    } else {
        // 视频未加载时，使用基于显示尺寸的像素位置
        updateMosaicArea(currentMosaicIndex, x * videoRatio, y * videoRatio, width * videoRatio, height * videoRatio, false);
    }
    
    // 更新水印框显示和输入框值
    updateMosaicBox();
    
    // 无论视频是否播放，都立即渲染以确保实时预览效果
    // 调整大小时需要最高优先级的实时反馈，特别是在视频播放时
    renderMosaicPreview();
    
    // 更新对应的输入框值，确保手动拖动时输入框也会同步变化
    const currentArea = mosaicAreas[currentMosaicIndex];
    if (currentArea) {
        // 计算当前遮挡区域的实际显示大小（考虑视频显示比例）
        const displayWidth = currentArea.width / videoRatio;
        const displayHeight = currentArea.height / videoRatio;
        
        // 更新遮挡区域大小输入框值为当前区域的平均大小（四舍五入到整数）
        const avgSize = Math.round((displayWidth + displayHeight) / 2);
        if (parseInt(areaSizeInput.value) !== avgSize) {
            areaSizeInput.value = avgSize;
        }
        
        // 更新其他类型特定的输入框
        switch (currentArea.type) {
            case 'mosaic':
                if (parseInt(mosaicSizeInput.value) !== currentArea.mosaicSize) {
                    mosaicSizeInput.value = currentArea.mosaicSize;
                }
                break;
            case 'blur':
                if (parseInt(mosaicSizeInput.value) !== currentArea.blurSize) {
                    mosaicSizeInput.value = currentArea.blurSize;
                }
                if (parseFloat(blurOpacityInput.value) !== currentArea.blurOpacity) {
                    blurOpacityInput.value = currentArea.blurOpacity;
                }
                break;
            case 'image':
                // 当调节缩放框时，根据图片的实际显示大小计算imageSize
                // 这确保了拖动时参数值能实时反映实际缩放比例
                let newImageSize = 100;
                
                // 如果有上传的图片，计算实际的图片大小比例
                if (currentArea.imageId && uploadedImages[currentArea.imageId]) {
                    const imageInfo = uploadedImages[currentArea.imageId];
                    const imageRatio = imageInfo.width / imageInfo.height;
                    const boxRatio = width / height;
                    
                    // 计算图片在缩放框内的实际显示尺寸（考虑居中显示）
                    let actualImageWidth, actualImageHeight;
                    if (imageRatio > boxRatio) {
                        // 图片较宽，按缩放框宽度显示，高度按比例缩放
                        actualImageWidth = width;
                        actualImageHeight = width / imageRatio;
                    } else {
                        // 图片较高或等比，按缩放框高度显示，宽度按比例缩放
                        actualImageHeight = height;
                        actualImageWidth = height * imageRatio;
                    }
                    
                    // 计算缩放比例：实际显示尺寸 / 图片原始尺寸
                    const scaleWidth = actualImageWidth / imageInfo.width;
                    const scaleHeight = actualImageHeight / imageInfo.height;
                    
                    // 取较小的缩放比例作为imageSize（因为图片可能会被按比例缩放，取较小值确保完整显示）
                    const scale = Math.min(scaleWidth, scaleHeight);
                    newImageSize = scale * 100;
                    
                    // 限制图片大小范围在5%-25%之间
                    newImageSize = Math.max(5, Math.min(25, newImageSize));
                }
                
                currentArea.imageSize = Math.round(newImageSize);
                
                // 更新输入框的值，确保拖动时参数值实时变化
                imageSizeInput.value = currentArea.imageSize;
                break;
        }
    }
};

// 调整大小结束处理
let onResizeDragUp = () => {
    // 保存当前马赛克索引
    const savedMosaicIndex = currentMosaicIndex;
    
    // 重置状态
    isResizing = false;
    currentHandle = null;
    // 确保重置复制标志，避免调整大小后继续复制
    shouldCopyMosaic = false;
    
    // 清理事件监听器，但不调用cleanupDragEvents以避免影响currentMosaicIndex
    document.removeEventListener('mousemove', onResizeDragMove);
    document.removeEventListener('mouseup', onResizeDragUp);
    
    // 确保savedMosaicIndex仍然有效
    if (savedMosaicIndex >= 0 && savedMosaicIndex < mosaicAreas.length) {
        // 确保currentMosaicIndex保持不变
        currentMosaicIndex = savedMosaicIndex;
        
        // 确保更新显示
        updateMosaicBox();
        
        // 确保mosaicBox保持active状态
        mosaicBox.classList.add('active');
    }
    
    // 确保最终渲染一次
    renderMosaicPreview();
};

// 设置拖拽事件
function setupDragDropEvents() {
    // 先清理之前可能存在的事件监听器
    cleanupDragEvents();
    
    // 点击视频添加遮挡区域
    videoPlayer.addEventListener('click', handleVideoClick);
    
    // 拖拽移动马赛克框
    mosaicBox.addEventListener('mousedown', handleMosaicBoxMouseDown);
    
    // 双击删除遮挡区域
    mosaicBox.addEventListener('dblclick', handleMosaicBoxDoubleClick);
    
    // 调整大小控制点事件
    const handles = mosaicBox.querySelectorAll('.mosaic-handle');
    handles.forEach(handle => {
        handle.addEventListener('mousedown', handleResizeHandleMouseDown);
    });
    
    // 添加文档级别的双击事件监听器，阻止视频放大
    document.addEventListener('dblclick', (e) => {
        // 检查事件目标是否是视频或视频容器，但排除马赛克框及其子元素
        if ((e.target === videoPlayer || 
            e.target === videoContainer || 
            videoPlayer.contains(e.target) || 
            videoContainer.contains(e.target)) &&
            !mosaicBox.contains(e.target) && // 排除马赛克框及其子元素
            e.target !== mosaicBox) {        // 排除马赛克框本身
            e.preventDefault();
            e.stopPropagation();
        }
    }, true); // 在捕获阶段监听
    
    // 给视频元素添加style属性，明确阻止双击放大
    videoPlayer.style.objectFit = 'contain';
    videoPlayer.style.maxHeight = '100%';
    videoPlayer.style.maxWidth = '100%';
    
    // 更激进的方案：完全禁用视频的默认行为
    videoPlayer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // 保存视频的原始尺寸
    let originalVideoWidth = videoPlayer.clientWidth;
    let originalVideoHeight = videoPlayer.clientHeight;
    
    // 创建一个MutationObserver来监控视频元素的大小变化
    const videoObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // 检查视频尺寸是否发生变化
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                // 检查视频尺寸是否变化
                if (videoPlayer.clientWidth !== originalVideoWidth || videoPlayer.clientHeight !== originalVideoHeight) {
                    // 立即恢复到原始尺寸
                    videoPlayer.style.width = `${originalVideoWidth}px`;
                    videoPlayer.style.height = `${originalVideoHeight}px`;
                    videoPlayer.style.objectFit = 'contain';
                }
            }
        });
    });
    
    // 观察视频元素的属性变化
    videoObserver.observe(videoPlayer, {
        attributes: true,
        attributeFilter: ['style']
    });
    
    // 直接覆盖视频元素的dblclick事件处理程序
    Object.defineProperty(videoPlayer, 'onclick', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function(e) {
            // 允许单击事件正常工作
        }
    });
    
    // 覆盖dblclick事件处理程序
    Object.defineProperty(videoPlayer, 'ondblclick', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function(e) {
            // 阻止双击事件的默认行为
            e.preventDefault();
            e.stopPropagation();
        }
    });
    
    // 确保视频元素不能进入全屏模式
    videoPlayer.requestFullscreen = () => {
        // 忽略请求
        return Promise.reject(new Error('Fullscreen is disabled'));
    };
    
    // 确保视频元素不能进入全屏模式（WebKit）
    videoPlayer.webkitRequestFullscreen = () => {
        // 忽略请求
    };
    
    // 确保视频元素不能进入全屏模式（Mozilla）
    videoPlayer.mozRequestFullScreen = () => {
        // 忽略请求
    };
    
    // 确保视频元素不能进入全屏模式（Microsoft）
    videoPlayer.msRequestFullscreen = () => {
        // 忽略请求
    };
    
    // 定期更新原始尺寸（例如窗口大小改变时）
    window.addEventListener('resize', () => {
        setTimeout(() => {
            originalVideoWidth = videoPlayer.clientWidth;
            originalVideoHeight = videoPlayer.clientHeight;
        }, 100);
    });
    
    // 获取自定义控件元素
    const videoWrapper = document.getElementById('mosaic-video-wrapper');
    const customControls = document.getElementById('mosaic-custom-controls');
    const playPauseButton = document.getElementById('mosaic-play-pause');
    const fullOverlay = document.getElementById('mosaic-full-overlay');
    
    // 实现自定义播放/暂停功能
    playPauseButton.addEventListener('click', () => {
        if (videoPlayer.paused) {
            videoPlayer.play();
            playPauseButton.textContent = '暂停';
        } else {
            videoPlayer.pause();
            playPauseButton.textContent = '播放';
        }
    });
    
    // 视频播放状态改变时更新按钮文本
    videoPlayer.addEventListener('play', () => {
        playPauseButton.textContent = '暂停';
    });
    
    videoPlayer.addEventListener('pause', () => {
        playPauseButton.textContent = '播放';
    });
    
    // 确保视频元素能够接收点击事件，以便添加水印
    videoPlayer.style.pointerEvents = 'auto';
    
    // 确保包装器能够接收所有点击事件
    videoWrapper.style.pointerEvents = 'auto';
    
    // 移除覆盖层的事件处理，因为我们已经恢复了视频元素的指针事件
    // 这样可以确保水印功能的点击交互正常工作
    
    // 保存视频容器的原始尺寸
    let originalContainerWidth = videoContainer.clientWidth;
    let originalContainerHeight = videoContainer.clientHeight;
    
    // 观察视频容器的尺寸变化
    const containerObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                if (videoContainer.clientWidth !== originalContainerWidth || videoContainer.clientHeight !== originalContainerHeight) {
                    // 立即恢复到原始尺寸
                    videoContainer.style.width = `${originalContainerWidth}px`;
                    videoContainer.style.height = `${originalContainerHeight}px`;
                }
            }
        });
    });
    
    containerObserver.observe(videoContainer, {
        attributes: true,
        attributeFilter: ['style']
    });
}

// 点击视频处理函数
function handleVideoClick(e) {
    // 确保不是点击马赛克框或其内部元素
    if (mosaicBox.contains(e.target) || isDragging || isResizing || !videoPlayer.src) return;
    
    // 检查当前类型的水印数量限制
    const currentType = mosaicTypeSelect.value;
    console.log('=== handleVideoClick START ===');
    console.log('handleVideoClick - currentType:', currentType);
    console.log('handleVideoClick - mosaicTypeSelect.value directly:', mosaicTypeSelect.value);
    // 添加更多关于select元素的信息
    console.log('handleVideoClick - mosaicTypeSelect selectedIndex:', mosaicTypeSelect.selectedIndex);
    console.log('handleVideoClick - mosaicTypeSelect options length:', mosaicTypeSelect.options.length);
    if (mosaicTypeSelect.selectedIndex >= 0) {
        console.log('handleVideoClick - selected option text:', mosaicTypeSelect.options[mosaicTypeSelect.selectedIndex].text);
        console.log('handleVideoClick - selected option value:', mosaicTypeSelect.options[mosaicTypeSelect.selectedIndex].value);
    }
    
    const canAdd = canAddWatermark(currentType);
    console.log('handleVideoClick - canAdd:', canAdd);
    
    if (!canAdd) {
        console.log('=== handleVideoClick END - Cannot add ===');
        return;
    }
    
    e.preventDefault();
    
    // 创建新的遮挡区域（默认居中）
    const newMosaicArea = createMosaicArea();
    console.log('handleVideoClick - newMosaicArea:', newMosaicArea);
    console.log('handleVideoClick - newMosaicArea.type:', newMosaicArea.type);
    
    // 添加到遮挡区域数组
    mosaicAreas.push(newMosaicArea);
    console.log('handleVideoClick - mosaicAreas after push:', mosaicAreas);
    console.log('handleVideoClick - mosaicAreas length after push:', mosaicAreas.length);
    
    currentMosaicIndex = mosaicAreas.length - 1;
    
    // 如果是图片类型且有临时存储的图片，则应用图片
    if (newMosaicArea.type === 'image' && tempUploadedImage) {
        // 保存图片信息到uploadedImages
        uploadedImages[newMosaicArea.imageId] = tempUploadedImage;
        
        // 设置图片大小参数
        const imageSize = parseInt(imageSizeInput.value) || 10;
        newMosaicArea.imageSize = imageSize;
        
        // 使用公共函数调整图片马赛克大小
        adjustImageMosaicSize(currentMosaicIndex, imageSize);
    }
    
    // 更新并显示马赛克框
    updateMosaicBox();
    console.log('=== handleVideoClick END - Added successfully ===');
    renderMosaicPreview();
    console.log('handleVideoClick - finished');
}

// Canvas点击处理函数 - 用于选择不同的遮挡区域
function handleCanvasClick(e) {
    if (isDragging || isResizing || !videoPlayer.src) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // 获取canvas的位置信息
    const canvas = document.getElementById('mosaic-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    // 计算点击位置在canvas中的坐标
    const clickX = e.clientX - canvasRect.left;
    const clickY = e.clientY - canvasRect.top;
    
    // 遍历所有遮挡区域，检查点击位置是否在某个区域内
    let clickedMosaicIndex = -1;
    for (let i = mosaicAreas.length - 1; i >= 0; i--) {
        const area = mosaicAreas[i];
        let areaX, areaY, areaWidth, areaHeight;
        
        if (area.percentX !== undefined && area.percentY !== undefined && area.percentWidth !== undefined && area.percentHeight !== undefined) {
            // 使用百分比坐标
            areaX = canvas.width * area.percentX;
            areaY = canvas.height * area.percentY;
            areaWidth = canvas.width * area.percentWidth;
            areaHeight = canvas.height * area.percentHeight;
        } else {
            // 使用像素坐标
            areaX = area.x / videoRatio;
            areaY = area.y / videoRatio;
            areaWidth = area.width / videoRatio;
            areaHeight = area.height / videoRatio;
        }
        
        // 检查点击位置是否在当前区域内
        if (clickX >= areaX && clickX <= areaX + areaWidth && clickY >= areaY && clickY <= areaY + areaHeight) {
            clickedMosaicIndex = i;
            break; // 找到最上层的遮挡区域（最后添加的）
        }
    }
    
    // 如果点击了某个遮挡区域，更新当前选中的索引
    if (clickedMosaicIndex >= 0) {
        currentMosaicIndex = clickedMosaicIndex;
        updateMosaicBox();
        mosaicBox.classList.add('active');
        renderMosaicPreview();
    }
}

// 马赛克框鼠标按下处理函数
function handleMosaicBoxMouseDown(e) {
    // 即使在拖动过程中点击，也不应该隐藏水印框
    // 只在明确不应该处理的情况下返回
    if (e.target.className.includes('mosaic-handle') || currentMosaicIndex < 0) return;
    
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡到视频容器，避免触发handleVideoClick
    
    // 确保视频容器信息是最新的
    updateVideoContainerRect();
    const containerRect = videoContainer.getBoundingClientRect();
    
    // 精确计算鼠标在视频内容区域中的位置
    const mouseXInVideoArea = e.clientX - containerRect.left - videoRect.left;
    const mouseYInVideoArea = e.clientY - containerRect.top - videoRect.top;
    
    // 获取当前水印框的位置和尺寸
    const updatedArea = mosaicAreas[currentMosaicIndex];
    const mosaicX = updatedArea.percentX * videoRect.width;
    const mosaicY = updatedArea.percentY * videoRect.height;
    const mosaicWidth = updatedArea.percentWidth * videoRect.width;
    const mosaicHeight = updatedArea.percentHeight * videoRect.height;
    
    // 计算水印框中心点位置
    const mosaicCenterX = mosaicX + mosaicWidth / 2;
    const mosaicCenterY = mosaicY + mosaicHeight / 2;
    
    // 精确计算鼠标相对于水印框中心点的偏移量，这是拖动流畅度的关键
    startX = mouseXInVideoArea - mosaicCenterX;
    startY = mouseYInVideoArea - mosaicCenterY;
    
    // 记录鼠标按下的初始位置，用于判断是否真正开始拖动
    initialMouseX = e.clientX;
    initialMouseY = e.clientY;
    
    // 避免重复添加事件监听器，但不调用cleanupDragEvents()以保留currentMosaicIndex
    // 先移除可能存在的事件监听器
    document.removeEventListener('mousemove', onMouseDragMove);
    document.removeEventListener('mouseup', onMouseDragUp);
    
    // 重置拖动状态，但保留currentMosaicIndex
    isDragging = false;
    isResizing = false;
    currentHandle = null;
    
    // 添加拖动事件监听器，但不立即设置isDragging为true，需要在mousemove中判断
    document.addEventListener('mousemove', onMouseDragMove);
    document.addEventListener('mouseup', onMouseDragUp);
}

// 马赛克框双击处理函数 - 禁用双击删除功能
function handleMosaicBoxDoubleClick(e) {
    if (isDragging || isResizing || e.target.className.includes('mosaic-handle') || currentMosaicIndex < 0) return;
    
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    
    // 移除当前遮挡区域
    mosaicAreas.splice(currentMosaicIndex, 1);
    
    if (mosaicAreas.length > 0) {
        currentMosaicIndex = Math.min(currentMosaicIndex, mosaicAreas.length - 1);
        updateMosaicBox();
    } else {
        currentMosaicIndex = -1;
        mosaicBox.classList.remove('active');
    }
    
    renderMosaicPreview();
}

// 调整大小控制点鼠标按下处理函数
function handleResizeHandleMouseDown(e) {
    if (currentMosaicIndex < 0) return;
    
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    isResizing = true;
    currentHandle = this.className.split(' ')[1];
    
    document.addEventListener('mousemove', onResizeDragMove);
    document.addEventListener('mouseup', onResizeDragUp);
}

// 设置所有事件监听器
function setupEventListeners() {
    // 视频上传处理
    videoUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // 保存原始文件名
            originalVideoFilename = file.name.replace(/\.[^/.]+$/, '');
            
            // 完全清理之前的资源和事件监听器
            cleanupVideoEvents();
            
            // 释放之前的Blob URL
            if (currentVideoBlobURL) {
                URL.revokeObjectURL(currentVideoBlobURL);
                currentVideoBlobURL = null;
            }
            if (processedVideoBlobURL) {
                URL.revokeObjectURL(processedVideoBlobURL);
                processedVideoBlobURL = null;
            }
            
            // 重置遮挡区域
            mosaicAreas = [];
            currentMosaicIndex = -1;
            mosaicBox.classList.remove('active');
            
            // 加载视频
            currentVideoBlobURL = URL.createObjectURL(file);
            videoPlayer.src = currentVideoBlobURL;
            
            // 视频元数据加载完成
            videoPlayer.onloadedmetadata = () => {
                videoDuration = videoPlayer.duration;
                totalDurationDisplay.textContent = formatTimeDisplay(videoDuration);
                
                // 设置默认时间范围
                startTimeInput.value = 0;
                endTimeInput.value = videoDuration.toFixed(1);
                
                // 应用视频容器尺寸限制和等比例缩放
                updateVideoContainerRect();
                
                // 显示canvas
                canvas.classList.remove('mosaic-hidden');
                
                // 显示设置区域和预览
                settingsSection.style.display = 'block';
                document.getElementById('mosaic-previewSection').classList.remove('mosaic-hidden');
                
                // 显示视频名称和大小
                const videoName = file.name;
                const videoSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                videoInfoElement.innerHTML = `
                    <span class="video-name">名称：${videoName}</span>
                    <span class="video-size">大小：${videoSizeMB} MB</span>
                `;
                videoInfoElement.style.display = 'block';
                
                // 初始化马赛克框和拖拽事件
                setTimeout(() => {
                    initializeMosaicBox();
                    setupDragDropEvents();
                    
                    // 启用按钮
                    applyMosaicBtn.disabled = false;
                    removeAllBtn.disabled = false;
                }, 100);
            };
            
            // 视频事件监听器
            // 使用requestAnimationFrame优化实时预览，确保播放时流畅显示效果
            const handleVideoTimeUpdate = () => {
                renderMosaicPreview();
                if (!videoPlayer.paused && !videoPlayer.ended) {
                    animationFrameId = requestAnimationFrame(handleVideoTimeUpdate);
                }
            };
            
            // 播放时启动连续渲染
            videoPlayer.addEventListener('play', () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
                handleVideoTimeUpdate();
            });
            
            // 暂停或结束时停止连续渲染
            videoPlayer.addEventListener('pause', () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
                renderMosaicPreview();
            });
            
            videoPlayer.addEventListener('ended', () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
                renderMosaicPreview();
            });
            
            // 记录视频事件处理函数，以便后续清理
            window._videoTimeUpdateHandler = handleVideoTimeUpdate;
            
            // 窗口大小变化时更新 - 使用防抖优化
            const handleWindowResize = debounce(() => {
                // 无论是否有选中的马赛克区域，都需要更新视频容器尺寸
                updateVideoContainerRect();
                
                // 如果有选中的马赛克区域，更新它的显示
                if (currentMosaicIndex >= 0) {
                    updateMosaicBox();
                }
                
                renderMosaicPreview(); // 窗口调整时使用即时渲染
            }, 100); // 窗口调整防抖时间可适当延长
            
            window.addEventListener('resize', handleWindowResize);
            
            // 记录窗口调整事件处理函数，以便后续清理
            window._resizeHandler = handleWindowResize;
        }
    });
    
    // 遮挡类型选择变化
    mosaicTypeSelect.addEventListener('change', () => {
        const type = mosaicTypeSelect.value;
        
        // 显示或隐藏相应的设置区域
        mosaicSizeSection.style.display = (type === 'mosaic' || type === 'blur') ? 'block' : 'none';
        textSection.style.display = type === 'text' ? 'block' : 'none';
        imageSection.style.display = type === 'image' ? 'block' : 'none';
        
        // 根据类型显示不同的参数控件
        if (type === 'mosaic') {
            // 马赛克类型：显示颜色，隐藏模糊透明度，设置较小的最大值
            document.querySelector('#mosaic-mosaicColor').closest('.mosaic-input-group').style.display = 'block';
            document.querySelector('#mosaic-blurOpacity').closest('.mosaic-input-group').style.display = 'none';
            mosaicSizeInput.max = 50;
            // 如果当前值超过最大值，调整为最大值
            if (parseInt(mosaicSizeInput.value) > 50) {
                mosaicSizeInput.value = 50;
            }
        } else if (type === 'blur') {
            // 模糊类型：隐藏颜色，显示模糊透明度，设置较大的最大值
            document.querySelector('#mosaic-mosaicColor').closest('.mosaic-input-group').style.display = 'none';
            document.querySelector('#mosaic-blurOpacity').closest('.mosaic-input-group').style.display = 'block';
            mosaicSizeInput.max = 200;
        } else {
            // 其他类型：隐藏所有控件
            document.querySelector('#mosaic-mosaicColor').closest('.mosaic-input-group').style.display = 'none';
            document.querySelector('#mosaic-blurOpacity').closest('.mosaic-input-group').style.display = 'none';
        }
        

    });
    
    // 手动触发一次类型选择事件，确保页面加载时根据默认选择的类型显示正确的设置区域
    mosaicTypeSelect.dispatchEvent(new Event('change'));
    
    // 马赛克大小变化
    mosaicSizeInput.addEventListener('input', () => {
        // 获取新的大小值
        const newSize = parseInt(mosaicSizeInput.value) || 10;
        
        // 只更新当前选中的遮挡区域的大小参数
        if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
            const area = mosaicAreas[currentMosaicIndex];
            if (area.type === 'mosaic') {
                area.mosaicSize = newSize;
            } else if (area.type === 'blur') {
                area.blurSize = newSize;
            }
        }
        
        // 确保当前选中的马赛克框保持显示
        if (currentMosaicIndex >= 0) {
            updateMosaicBox();
            mosaicBox.classList.add('active');
        }
        
        // 重新渲染预览
        renderMosaicPreview();
    });
    
    // 遮挡区域大小变化
    areaSizeInput.addEventListener('input', () => {
        // 获取新的区域大小值
        const newAreaSize = parseInt(areaSizeInput.value) || 150;
        
        // 更新当前选中的遮挡区域大小
        if (currentMosaicIndex >= 0 && videoRect) {
            const area = mosaicAreas[currentMosaicIndex];
            
            // 计算新的显示尺寸
            const displayWidth = newAreaSize;
            const displayHeight = newAreaSize;
            
            // 计算新的百分比尺寸
            const percentWidth = displayWidth / videoRect.width;
            const percentHeight = displayHeight / videoRect.height;
            
            if (area.percentX !== undefined && area.percentY !== undefined) {
                // 如果使用百分比坐标，保持中心不变
                const currentWidth = canvas.width * (area.percentWidth || 0.15);
                const currentHeight = canvas.height * (area.percentHeight || 0.15);
                const centerXPercent = area.percentX + (area.percentWidth || 0.15) / 2;
                const centerYPercent = area.percentY + (area.percentHeight || 0.15) / 2;
                
                // 更新百分比宽度和高度
                area.percentWidth = percentWidth;
                area.percentHeight = percentHeight;
                
                // 重新计算位置以保持中心不变
                area.percentX = centerXPercent - area.percentWidth / 2;
                area.percentY = centerYPercent - area.percentHeight / 2;
            } else {
                // 如果使用像素坐标，保持中心不变
                const centerX = area.x + area.width / 2;
                const centerY = area.y + area.height / 2;
                
                area.width = displayWidth;
                area.height = displayHeight;
                
                // 重新计算位置以保持中心不变
                area.x = centerX - area.width / 2;
                area.y = centerY - area.height / 2;
            }
            
            // 更新马赛克框显示
            updateMosaicBox();
            mosaicBox.classList.add('active');
            
            // 重新渲染预览
            renderMosaicPreview();
        }
    });
    
    // 马赛克颜色变化
    mosaicColorInput.addEventListener('input', () => {
        // 只更新当前选中的遮挡区域的马赛克颜色参数
        if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
            const area = mosaicAreas[currentMosaicIndex];
            if (area.type === 'mosaic') {
                updateMosaicArea(currentMosaicIndex);
            }
        }
        // 确保当前选中的马赛克框保持显示
        if (currentMosaicIndex >= 0) {
            updateMosaicBox();
            mosaicBox.classList.add('active');
        }
        renderMosaicPreview();
    });
    
    // 图片大小变化
    imageSizeInput.addEventListener('input', () => {
        // 获取新的图片大小值，并限制在5%-25%之间
        const newImageSize = Math.max(5, Math.min(25, parseInt(imageSizeInput.value) || 100));
        
        // 更新输入框的值，确保显示的是限制后的值
        imageSizeInput.value = newImageSize;
        
        // 只更新当前选中的图片类型的遮挡区域
        if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
            const area = mosaicAreas[currentMosaicIndex];
            if (area.type === 'image') {
                // 更新图片大小
                area.imageSize = newImageSize;
                
                // 当修改图片大小时，同时调整拖动框的大小以匹配新的图片显示尺寸
                if (area.imageId && uploadedImages[area.imageId]) {
                    // 获取图片信息
                    const imageInfo = uploadedImages[area.imageId];
                    
                    // 更新视频容器信息
                    updateVideoContainerRect();
                    
                    // 当前框的位置和大小
                    const currentDisplayWidth = area.percentWidth * videoRect.width;
                    const currentDisplayHeight = area.percentHeight * videoRect.height;
                    
                    // 计算新的图片原始尺寸（考虑imageSize参数）
                    // 但要限制最大尺寸不超过视频本身的大小
                    const maxPossibleWidth = videoPlayer.videoWidth;
                    const maxPossibleHeight = videoPlayer.videoHeight;
                    
                    // 先计算基于imageSize的尺寸
                    let scaledImageWidth = imageInfo.width * (newImageSize / 100);
                    let scaledImageHeight = imageInfo.height * (newImageSize / 100);
                    
                    // 如果计算出的尺寸超过视频尺寸，限制为视频尺寸
                    const imageRatio = imageInfo.width / imageInfo.height;
                    
                    if (scaledImageWidth > maxPossibleWidth) {
                        scaledImageWidth = maxPossibleWidth;
                        scaledImageHeight = scaledImageWidth / imageRatio;
                    }
                    
                    if (scaledImageHeight > maxPossibleHeight) {
                        scaledImageHeight = maxPossibleHeight;
                        scaledImageWidth = scaledImageHeight * imageRatio;
                    }
                    
                    // 计算新的框尺寸，确保能完整显示调整后的图片
                    // 这里的逻辑与onResizeDragMove函数中的计算方式保持一致
                    let newBoxWidth, newBoxHeight;
                    
                    // 计算框的尺寸，确保图片能完整显示在框内，同时保持宽高比
                    if (imageRatio > (scaledImageWidth / scaledImageHeight)) {
                        // 图片更宽，按宽度计算
                        newBoxWidth = scaledImageWidth;
                        newBoxHeight = scaledImageWidth / imageRatio;
                    } else {
                        // 图片更高，按高度计算
                        newBoxHeight = scaledImageHeight;
                        newBoxWidth = scaledImageHeight * imageRatio;
                    }
                    
                    // 计算新的左上角位置
                    let newX, newY;
                    
                    // 根据不同的角落位置使用不同的基准点
                    if (area.imagePosition === 'left-top') {
                        // 左上角：保持左上角位置不变
                        newX = area.percentX * videoRect.width;
                        newY = area.percentY * videoRect.height;
                    } else if (area.imagePosition === 'left-bottom') {
                        // 左下角：保持左下角位置不变
                        newX = area.percentX * videoRect.width;
                        newY = (area.percentY * videoRect.height + currentDisplayHeight) - newBoxHeight;
                    } else if (area.imagePosition === 'right-top') {
                        // 右上角：保持右上角位置不变
                        newX = (area.percentX * videoRect.width + currentDisplayWidth) - newBoxWidth;
                        newY = area.percentY * videoRect.height;
                    } else if (area.imagePosition === 'right-bottom') {
                        // 右下角：保持右下角位置不变
                        newX = (area.percentX * videoRect.width + currentDisplayWidth) - newBoxWidth;
                        newY = (area.percentY * videoRect.height + currentDisplayHeight) - newBoxHeight;
                    } else {
                        // 其他位置保持中心点不变
                        const centerX = area.percentX * videoRect.width + currentDisplayWidth / 2;
                        const centerY = area.percentY * videoRect.height + currentDisplayHeight / 2;
                        newX = centerX - newBoxWidth / 2;
                        newY = centerY - newBoxHeight / 2;
                    }
                    
                    // 添加边界检查，确保遮挡框不会超出视频容器
                    if (newX < 0) newX = 0;
                    if (newY < 0) newY = 0;
                    if (newX + newBoxWidth > videoRect.width) {
                        newX = videoRect.width - newBoxWidth;
                    }
                    if (newY + newBoxHeight > videoRect.height) {
                        newY = videoRect.height - newBoxHeight;
                    }
                    
                    // 更新遮挡区域的百分比位置和尺寸
                    area.percentX = newX / videoRect.width;
                    area.percentY = newY / videoRect.height;
                    area.percentWidth = newBoxWidth / videoRect.width;
                    area.percentHeight = newBoxHeight / videoRect.height;
                    
                    // 对于角落位置，重新应用位置设置，确保完全回到角落
                    if (['left-top', 'left-bottom', 'right-top', 'right-bottom'].includes(area.imagePosition)) {
                        // 重新应用位置设置，确保图片完全回到角落
                        updateMosaicArea(currentMosaicIndex, undefined, undefined, undefined, undefined, false, true);
                    } else {
                        // 更新像素位置（用于后端处理）
                        if (videoPlayer.videoWidth > 0 && videoPlayer.videoHeight > 0) {
                            const pixelX = area.percentX * videoPlayer.videoWidth;
                            const pixelY = area.percentY * videoPlayer.videoHeight;
                            const pixelWidth = area.percentWidth * videoPlayer.videoWidth;
                            const pixelHeight = area.percentHeight * videoPlayer.videoHeight;
                            updateMosaicArea(currentMosaicIndex, pixelX, pixelY, pixelWidth, pixelHeight, false);
                        } else {
                            // 视频未加载时，使用基于显示尺寸的像素位置
                            updateMosaicArea(currentMosaicIndex, newX * videoRatio, newY * videoRatio, newBoxWidth * videoRatio, newBoxHeight * videoRatio, false);
                        }
                    }
                }
            }
        }
        // 确保当前选中的马赛克框保持显示并更新
        if (currentMosaicIndex >= 0) {
            updateMosaicBox();
            mosaicBox.classList.add('active');
        }
        renderMosaicPreview();
    });
    
    // 模糊透明度变化
    blurOpacityInput.addEventListener('input', () => {
        // 获取新的模糊透明度值
        const newBlurOpacity = parseInt(blurOpacityInput.value) || 100;
        
        // 只更新当前选中的模糊类型的遮挡区域
        if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
            const area = mosaicAreas[currentMosaicIndex];
            if (area.type === 'blur') {
                area.blurOpacity = newBlurOpacity;
            }
        }
        // 确保当前选中的马赛克框保持显示
        if (currentMosaicIndex >= 0) {
            updateMosaicBox();
            mosaicBox.classList.add('active');
        }
        renderMosaicPreview();
    });
    
    // 文字内容变化 - 更新当前选中的文字类型遮挡区域并刷新显示
    mosaicTextInput.addEventListener('input', () => {
        // 只更新当前选中的文字类型遮挡区域，但不更新百分比坐标，避免位置重置
        if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
            const area = mosaicAreas[currentMosaicIndex];
            if (area.type === 'text') {
                updateMosaicArea(currentMosaicIndex, undefined, undefined, undefined, undefined, false);
            }
        }
        // 确保当前选中的马赛克框保持显示
        if (currentMosaicIndex >= 0) {
            updateMosaicBox();
            mosaicBox.classList.add('active');
        }
        // 重新渲染预览，确保水印立即显示在视频上
        renderMosaicPreview();
    });
    
    // 文字输入框失去焦点时，再次触发位置更新，确保水印位置符合下拉选中的值
    mosaicTextInput.addEventListener('blur', () => {
        // 只更新当前选中的文字类型遮挡区域的位置
        if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
            const area = mosaicAreas[currentMosaicIndex];
            if (area.type === 'text') {
                updateMosaicArea(currentMosaicIndex, undefined, undefined, undefined, undefined, true, true);
            }
        }
        // 确保当前选中的马赛克框保持显示
        if (currentMosaicIndex >= 0) {
            updateMosaicBox();
            mosaicBox.classList.add('active');
        }
        // 重新渲染预览
        renderMosaicPreview();
    });
    
    // 文字大小变化
    mosaicTextSizeInput.addEventListener('input', () => {
        // 获取新的文字大小值
        const newTextSize = parseInt(mosaicTextSizeInput.value) || 14;
        
        // 只更新当前选中的文字类型的遮挡区域
        if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
            const area = mosaicAreas[currentMosaicIndex];
            if (area.type === 'text') {
                area.textSize = newTextSize;
                // 更新遮挡区域，确保尺寸正确
                updateMosaicArea(currentMosaicIndex, undefined, undefined, undefined, undefined, false);
            }
        }
        // 确保当前选中的马赛克框保持显示
        if (currentMosaicIndex >= 0) {
            updateMosaicBox();
            mosaicBox.classList.add('active');
        }
        // 重新渲染预览，确保水印立即显示在视频上
        renderMosaicPreview();
    });
    
    // 文字颜色变化
    mosaicTextColorInput.addEventListener('input', () => {
        // 获取新的文字颜色值
        const newTextColor = mosaicTextColorInput.value;
        
        // 只更新当前选中的文字类型的遮挡区域
        if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
            const area = mosaicAreas[currentMosaicIndex];
            if (area.type === 'text') {
                area.textColor = newTextColor;
            }
        }
        // 确保当前选中的马赛克框保持显示
        if (currentMosaicIndex >= 0) {
            updateMosaicBox();
            mosaicBox.classList.add('active');
        }
        // 重新渲染预览，确保水印立即显示在视频上
        renderMosaicPreview();
    });
    
    // 水印位置变化
    mosaicTextPositionInput.addEventListener('change', () => {
        // 只更新当前选中的文字类型的遮挡区域
        if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
            const area = mosaicAreas[currentMosaicIndex];
            if (area.type === 'text') {
                updateMosaicArea(currentMosaicIndex, undefined, undefined, undefined, undefined, true, true);
            }
        }
        // 确保当前选中的马赛克框保持显示
        if (currentMosaicIndex >= 0) {
            updateMosaicBox();
            mosaicBox.classList.add('active');
        }
        // 重新渲染预览，确保水印立即显示在视频上
        renderMosaicPreview();
    });
    
    // 文字滚动效果变化
    mosaicTextScrollInput.addEventListener('change', () => {
        // 只更新当前选中的文字类型的遮挡区域，但不更新百分比坐标，避免位置重置
        if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
            const area = mosaicAreas[currentMosaicIndex];
            if (area.type === 'text') {
                updateMosaicArea(currentMosaicIndex, undefined, undefined, undefined, undefined, false);
            }
        }
        // 确保当前选中的马赛克框保持显示
        if (currentMosaicIndex >= 0) {
            updateMosaicBox();
            mosaicBox.classList.add('active');
        }
        // 重新渲染预览，确保水印立即显示在视频上
        renderMosaicPreview();
    });
    
    // 图片上传
    mosaicImageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const image = new Image();
            const imageURL = URL.createObjectURL(file);
            
            image.onload = () => {
                URL.revokeObjectURL(imageURL);
                
                // 保存当前上传的图片到临时变量（覆盖之前的图片）
                const newImage = {
                    element: image,
                    width: image.width,
                    height: image.height,
                    aspectRatio: image.width / image.height
                };
                
                // 总是更新临时存储的图片，作为最后一次上传的图片
                tempUploadedImage = newImage;
                
                // 如果有选中的图片类型马赛克区域，则立即应用图片
                if (currentMosaicIndex >= 0 && mosaicAreas[currentMosaicIndex].type === 'image') {
                    // 保存图片信息，包括宽高比
                    const imageId = mosaicAreas[currentMosaicIndex].imageId;
                    uploadedImages[imageId] = newImage;
                    
                    // 设置图片大小参数
                    const imageSize = parseInt(imageSizeInput.value) || 10;
                    mosaicAreas[currentMosaicIndex].imageSize = imageSize;
                    
                    // 使用公共函数调整图片马赛克大小
                    adjustImageMosaicSize(currentMosaicIndex, imageSize);
                    
                    // 更新显示
                    updateMosaicBox();
                    renderMosaicPreview();
                }
            };
            
            image.src = imageURL;
        }
    });
    
    // 时间设置变化
    startTimeInput.addEventListener('input', () => {
        if (parseFloat(startTimeInput.value) < 0) {
            startTimeInput.value = 0;
        }
        if (parseFloat(startTimeInput.value) > parseFloat(endTimeInput.value)) {
            startTimeInput.value = (parseFloat(endTimeInput.value) - 0.1).toFixed(1);
        }
        
        if (currentMosaicIndex >= 0) {
            updateMosaicArea(currentMosaicIndex);
            renderMosaicPreview();
        }
    });
    
    endTimeInput.addEventListener('input', () => {
        if (parseFloat(endTimeInput.value) > videoDuration) {
            endTimeInput.value = videoDuration.toFixed(1);
        }
        if (parseFloat(endTimeInput.value) < parseFloat(startTimeInput.value)) {
            endTimeInput.value = (parseFloat(startTimeInput.value) + 0.1).toFixed(1);
        }
        
        if (currentMosaicIndex >= 0) {
            updateMosaicArea(currentMosaicIndex);
            renderMosaicPreview();
        }
    });
    
    // 应用遮挡按钮
    applyMosaicBtn.addEventListener('click', async () => {
        if (mosaicAreas.length === 0) {
            showMessage('请先添加至少一个遮挡区域');
            return;
        }
        
        // 显示处理中状态
        applyMosaicBtn.textContent = '勿刷新页面，视频处理中...';
        applyMosaicBtn.disabled = true;
        removeAllBtn.disabled = true;
        
        try {
            // 处理视频
            await processVideo();
        } catch (error) {
            console.error('视频处理失败:', error);
            showMessage('视频处理失败，请尝试较小的视频文件');
        } finally {
            applyMosaicBtn.textContent = '确认添加水印';
            applyMosaicBtn.disabled = false;
            removeAllBtn.disabled = false;
        }
    });
    
    // 移除所有遮挡按钮
    removeAllBtn.addEventListener('click', () => {
        mosaicAreas = [];
        currentMosaicIndex = -1;
        mosaicBox.classList.remove('active');
        renderMosaicPreview();
        showMessage('已移除所有遮挡区域');
    });

    // 滚动速度输入事件监听
    if (mosaicTextScrollSpeedInput) {
        mosaicTextScrollSpeedInput.addEventListener('input', (e) => {
            const speed = e.target.value;
            if (scrollSpeedValueDisplay) {
                scrollSpeedValueDisplay.textContent = speed;
            }
            // 更新当前选中的水印区域的滚动速度
            if (currentMosaicIndex >= 0 && mosaicAreas[currentMosaicIndex].type === 'text') {
                // 保持与创建时相同的对象格式，包含horizontal和vertical属性
                const horizontalSpeed = parseInt(speed) || 50;
                const verticalSpeed = Math.round(horizontalSpeed * 0.6); // 垂直滚动速度为水平的60%
                mosaicAreas[currentMosaicIndex].scrollSpeed = {
                    horizontal: horizontalSpeed,
                    vertical: verticalSpeed
                };
                renderMosaicPreview(); // 重新渲染预览以显示效果
            }
        });
    }
    
    // 水印透明度输入事件监听
    if (mosaicTextOpacityInput) {
        mosaicTextOpacityInput.addEventListener('input', (e) => {
            const opacity = e.target.value;
            if (textOpacityValueDisplay) {
                textOpacityValueDisplay.textContent = parseFloat(opacity).toFixed(1);
            }
            // 更新当前选中的水印区域的透明度
            if (currentMosaicIndex >= 0 && mosaicAreas[currentMosaicIndex].type === 'text') {
                mosaicAreas[currentMosaicIndex].textOpacity = parseFloat(opacity) || 1.0;
                renderMosaicPreview(); // 重新渲染预览以显示效果
            }
        });
    }

    // 图片水印位置变化事件监听
    if (mosaicImagePositionInput) {
        mosaicImagePositionInput.addEventListener('change', () => {
            // 只更新当前选中的图片类型的遮挡区域
            if (currentMosaicIndex >= 0 && currentMosaicIndex < mosaicAreas.length) {
                const area = mosaicAreas[currentMosaicIndex];
                if (area.type === 'image') {
                    area.imagePosition = mosaicImagePositionInput.value;
                    // 更新遮挡区域位置
                    updateMosaicArea(currentMosaicIndex, undefined, undefined, undefined, undefined, true, true);
                }
            }
            // 确保当前选中的马赛克框保持显示
            if (currentMosaicIndex >= 0) {
                updateMosaicBox();
                mosaicBox.classList.add('active');
            }
            // 重新渲染预览
            renderMosaicPreview();
        });
    }

    // 图片水印透明度输入事件监听
    if (mosaicImageOpacityInput) {
        mosaicImageOpacityInput.addEventListener('input', (e) => {
            const opacity = e.target.value;
            if (imageOpacityValueDisplay) {
                imageOpacityValueDisplay.textContent = parseFloat(opacity).toFixed(1);
            }
            if (currentMosaicIndex >= 0 && mosaicAreas[currentMosaicIndex].type === 'image') {
                mosaicAreas[currentMosaicIndex].imageOpacity = parseFloat(opacity) || 1.0;
                renderMosaicPreview(); // 重新渲染预览以显示效果
            }
        });
    }
}

// 清理视频相关事件监听器
function cleanupVideoEvents() {
    // 移除连续渲染的动画帧
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // 移除视频事件监听器
    videoPlayer.removeEventListener('timeupdate', renderMosaicPreview);
    videoPlayer.removeEventListener('timeupdate', debouncedRenderMosaicPreview);
    videoPlayer.removeEventListener('play', renderMosaicPreview);
    videoPlayer.removeEventListener('play', debouncedRenderMosaicPreview);
    videoPlayer.removeEventListener('pause', renderMosaicPreview);
    videoPlayer.removeEventListener('pause', debouncedRenderMosaicPreview);
    
    // 移除自定义的时间更新处理函数
    if (window._videoTimeUpdateHandler) {
        videoPlayer.removeEventListener('play', window._videoTimeUpdateHandler);
        delete window._videoTimeUpdateHandler;
    }
    
    // 移除窗口调整事件监听器
    if (window._resizeHandler) {
        window.removeEventListener('resize', window._resizeHandler);
        delete window._resizeHandler;
    }
    
    // 移除视频点击和马赛克框事件监听器
    videoPlayer.removeEventListener('click', handleVideoClick);
    mosaicBox.removeEventListener('mousedown', handleMosaicBoxMouseDown);
    mosaicBox.removeEventListener('dblclick', handleMosaicBoxDoubleClick);
    
    // 移除调整大小控制点事件监听器
    const handles = mosaicBox.querySelectorAll('.mosaic-handle');
    handles.forEach(handle => {
        handle.removeEventListener('mousedown', handleResizeHandleMouseDown);
    });
    
    // 清理拖拽相关状态
    cleanupDragEvents();
    
    // 清理视频信息显示
    if (videoInfoElement) {
        videoInfoElement.innerHTML = '';
        videoInfoElement.style.display = 'none';
    }
}

// 释放资源
function releaseResources() {
    // 释放Blob URL
    if (currentVideoBlobURL) {
        URL.revokeObjectURL(currentVideoBlobURL);
        currentVideoBlobURL = null;
    }
    if (processedVideoBlobURL) {
        URL.revokeObjectURL(processedVideoBlobURL);
        processedVideoBlobURL = null;
    }
    
    // 释放所有上传图片的Blob URL
    Object.values(uploadedImages).forEach(image => {
        if (image.src.startsWith('blob:')) {
            URL.revokeObjectURL(image.src);
        }
    });
    uploadedImages = {};
    
    // 清理事件监听器
    cleanupVideoEvents();
    
    // 重置状态
    mosaicAreas = [];
    currentMosaicIndex = -1;
    mosaicBox.classList.remove('active');
}

// 页面卸载时释放所有资源
window.addEventListener('unload', releaseResources);

// 处理视频并应用遮挡
// 更新进度条函数
function updateProgress(progress) {
    if (progressBar && progressPercentage) {
        const percent = Math.min(1, Math.max(0, progress)) * 100;
        progressBar.style.width = `${percent}%`;
        progressPercentage.textContent = `${Math.round(percent)}%`;
    }
}

// 处理视频并应用遮挡
async function processVideo() {
    // 显示进度条
    if (progressContainer) {
        progressContainer.style.display = 'block';
    }
    // 重置进度条
    updateProgress(0);
    // 创建临时Canvas
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // 设置Canvas尺寸为视频实际尺寸
    tempCanvas.width = videoPlayer.videoWidth;
    tempCanvas.height = videoPlayer.videoHeight;
    
    // 创建MediaRecorder录制处理后的视频，并添加原始音频
    const stream = tempCanvas.captureStream(30);
    
    // 获取原始视频的音频轨道并添加到新流中
    const originalAudioTracks = videoPlayer.captureStream().getAudioTracks();
    originalAudioTracks.forEach(track => {
        stream.addTrack(track);
    });
    
    // 尝试使用MP4格式，如果不支持则回退到WebM
    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4;codecs=h264,aac';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp9,opus'; // 回退到WebM
        }
    }
    const mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };
    
    // 录制停止处理
    const recordingStopped = new Promise(resolve => {
        mediaRecorder.onstop = () => resolve();
    });
    
    // 开始录制
    mediaRecorder.start();
    
    // 获取用户设置的开始和结束时间（用于水印显示控制）
    const userStartTime = parseFloat(startTimeInput.value) || 0;
    const userEndTime = parseFloat(endTimeInput.value) || videoDuration;
    
    // 保存当前视频播放状态
    const wasPlaying = !videoPlayer.paused;
    const currentTime = videoPlayer.currentTime;
    
    // 跳转到视频开始位置，录制整个视频（确保处理完整视频，只在指定时间范围内添加水印）
    videoPlayer.currentTime = 0;
    
    // 播放视频
    try {
        await videoPlayer.play();
    } catch (e) {
        console.warn('自动播放失败，尝试用户交互后播放');
    }
    
    // 处理每一帧，传递整个视频的时间范围，确保完整处理视频
    // 水印将只在各水印区域自身的startTime和endTime范围内显示
    await drawProcessedFrames(tempCanvas, tempCtx, 0, videoDuration);
    
    // 确保进度条显示100%
    updateProgress(1);
    
    // 停止录制
    mediaRecorder.stop();
    await recordingStopped;
    
    // 恢复视频到原始状态
    videoPlayer.pause();
    videoPlayer.currentTime = currentTime;
    
    // 如果原视频是播放状态，恢复播放
    if (wasPlaying) {
        try {
            await videoPlayer.play();
        } catch (e) {
            console.warn('无法恢复播放状态');
        }
    }
    
    // 恢复原视频的可编辑状态
    updateVideoContainerRect();
    updateMosaicBox();
    
    // 确保视频时间更新时的实时渲染
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    if (!videoPlayer.paused && !videoPlayer.ended) {
        animationFrameId = requestAnimationFrame(handleVideoTimeUpdate);
    }
    
    // 立即重新渲染预览
    renderMosaicPreview();
    
    // 释放之前的处理后视频Blob URL
    if (processedVideoBlobURL) {
        URL.revokeObjectURL(processedVideoBlobURL);
    }
    
    // 创建最终视频，使用与录制相同的MIME类型
    const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
    processedVideoBlobURL = URL.createObjectURL(blob);
    
    // 显示处理后的视频
    outputVideo.src = processedVideoBlobURL;
    outputSection.style.display = 'block';
    
    // 设置下载功能，根据MIME类型设置正确的文件扩展名
    const fileExtension = mediaRecorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
    downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = processedVideoBlobURL;
        a.download = `processed-${originalVideoFilename || 'video'}.${fileExtension}`;
        a.click();
    };
    downloadBtn.disabled = false;
    
    // 隐藏进度条
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
}

// 绘制处理后的视频帧
async function drawProcessedFrames(tempCanvas, tempCtx, startTime, endTime) {
    return new Promise(resolve => {
        const totalDuration = endTime - startTime;
        const processFrame = () => {
            // 添加一个小的缓冲（0.1秒），确保即使最后一帧的时间略小于endTime也能被正确处理
            // 避免因为帧率不一致导致最后一秒缺失
            if (videoPlayer.currentTime >= endTime || videoPlayer.ended) {
                resolve();
                return;
            }
            
            // 更新进度条
            const progress = Math.min((videoPlayer.currentTime - startTime) / totalDuration, 1);
            updateProgress(progress);
            
            try {
                // 绘制当前视频帧到临时Canvas
                tempCtx.drawImage(videoPlayer, 0, 0, tempCanvas.width, tempCanvas.height);
                
                // 应用所有遮挡区域
                mosaicAreas.forEach(area => {
                    // 检查当前帧是否在水印显示的时间范围内
                    if (videoPlayer.currentTime >= area.startTime && videoPlayer.currentTime <= area.endTime) {
                        // 使用百分比坐标系统计算位置和大小，确保与预览时一致
                        let x, y, width, height;
                        
                        if (area.percentX !== undefined && area.percentY !== undefined && area.percentWidth !== undefined && area.percentHeight !== undefined) {
                            // 优先使用百分比坐标系统
                            x = tempCanvas.width * area.percentX;
                            y = tempCanvas.height * area.percentY;
                            width = tempCanvas.width * area.percentWidth;
                            height = tempCanvas.height * area.percentHeight;
                        } else {
                            // 兼容旧数据
                            x = area.x;
                            y = area.y;
                            width = area.width;
                            height = area.height;
                        }
                        
                        // 根据遮挡类型应用效果
                        switch (area.type) {
                            case 'mosaic':
                                // 使用统一的drawMosaic函数处理马赛克效果，确保与预览时一致
                                // 计算视频实际尺寸与预览尺寸的比例，用于调整马赛克大小
                                const scaleRatioMosaic = tempCanvas.width / canvas.width;
                                // 根据比例调整马赛克大小，确保导出时与预览时视觉大小一致
                                drawMosaic(tempCtx, x, y, width, height, area.mosaicSize * scaleRatioMosaic, area.mosaicColor);
                                break;
                            case 'blur':
                                // 使用统一的drawBlur函数处理模糊效果，确保与预览时一致
                                // 模糊效果的强度与Canvas分辨率有关
                                // 在不同分辨率的Canvas上，相同像素值的模糊会产生不同的视觉效果
                                // 为了保持预览和最终视频的视觉一致性，我们需要根据分辨率比例调整模糊大小
                                const blurSize = area.blurSize || 10;
                                const blurOpacity = area.blurOpacity || 100;
                                // 计算视频实际尺寸与预览尺寸的比例，用于调整模糊大小
                                const scaleRatioBlur = tempCanvas.width / canvas.width;
                                // 根据比例调整模糊大小，确保导出时与预览时视觉效果一致
                                drawBlur(tempCtx, x, y, width, height, blurSize * scaleRatioBlur, blurOpacity);
                                break;
                            case 'text':
                                // 调用drawText函数，包含滚动逻辑
                                // 计算文字大小比例：视频实际尺寸与预览尺寸的比例
                                const scaleRatioText = tempCanvas.width / canvas.width;
                                // 根据比例调整文字大小，确保导出时与预览时视觉大小一致
                                const adjustedTextSize = area.textSize * scaleRatioText;
                                // 传递当前视频时间，确保导出时滚动速度与预览一致
                                drawText(tempCtx, x, y, width, height, area.text, adjustedTextSize, area.textColor, area.scrollType || 'fixed', area.scrollSpeed, area.textOpacity || 1.0, videoPlayer.currentTime);
                                break;
                            case 'image':
                                // 使用统一的drawImage函数处理图片水印，确保与预览时一致
                                drawImage(tempCtx, x, y, width, height, area.imageId, area.imageSize || 100, area.imagePosition || 'left-top', area.imageOpacity || 1.0);
                                break;
                        }
                    }
                });
                
                // 继续处理下一帧
                requestAnimationFrame(processFrame);
            } catch (error) {
                console.error('处理帧时出错:', error);
                resolve();
            }
        };
        
        // 开始处理
        processFrame();
    });
}

// 格式化时间显示
function formatTimeDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(4, '0')}`;
}

// 显示提示信息
function showMessage(message, duration = 3000) {
    const messageContainer = document.getElementById('mosaic-messageContainer');
    const messageText = document.getElementById('mosaic-messageText');
    
    if (messageContainer && messageText) {
        messageText.textContent = message;
        messageContainer.style.display = 'block';
        
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, duration);
    }
}

// 页面加载完成后初始化应用
window.addEventListener('load', initApp);