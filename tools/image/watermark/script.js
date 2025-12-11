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
const watermarkDensity = document.getElementById('watermarkDensity');
const densityValue = document.getElementById('densityValue');
const previewContainer = document.getElementById('previewContainer');
const downloadCurrentImage = document.getElementById('downloadCurrentImage');
const downloadAllImages = document.getElementById('downloadAllImages');
const textWatermarkGroup = document.getElementById('textWatermarkGroup');
const imageWatermarkGroup = document.getElementById('imageWatermarkGroup');
const imageWatermarkUpload = document.getElementById('imageWatermarkUpload');
const manualPositionInfo = document.getElementById('manualPositionInfo');
const applyToAllImages = document.getElementById('applyToAllImages');

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
let fullscreenModal = null; // 全屏模态框

// 批量处理相关变量
let uploadedFiles = []; // 存储所有上传的文件信息
let selectedFileIndex = -1; // 当前选中的文件索引

// 水印位置信息 - 现在每个文件将拥有自己的水印位置

// 辅助函数：获取当前选中的水印类型
function getSelectedWatermarkType() {
    const selectedRadio = document.querySelector('input[name="watermarkType"]:checked');
    return selectedRadio ? selectedRadio.value : 'text'; // 默认返回'text'
}

// 全局变量：全屏缩放比例
let fullscreenCurrentScale = 0.8;  // 当前缩放比例（初始值稍后会被onload覆盖）
let fullscreenMinScale = 0.5; // 最小缩放比例（30%）
let fullscreenMaxScale = 1.5; // 最大缩放比例（150%），允许放大到原始尺寸以上
    

// 图片全屏放大函数
function zoomImageFullscreen(imgElement) {
    // 移除已存在的模态框
    if (fullscreenModal) {
        document.body.removeChild(fullscreenModal);
        fullscreenModal = null;
        // 恢复body样式
        document.body.style.overflow = '';
        document.body.style.backgroundColor = '';
        return;
    }
    
    // 创建模态框容器
    fullscreenModal = document.createElement('div');
    fullscreenModal.className = 'fullscreen-modal';
    fullscreenModal.style.position = 'fixed';
    fullscreenModal.style.top = '0';
    fullscreenModal.style.left = '0';
    fullscreenModal.style.width = '100%';
    fullscreenModal.style.height = '100%';
    fullscreenModal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    fullscreenModal.style.display = 'flex';
    fullscreenModal.style.justifyContent = 'center';
    fullscreenModal.style.alignItems = 'center';
    fullscreenModal.style.zIndex = '1000';
    fullscreenModal.style.cursor = 'zoom-out';
    
    // 创建图片容器
    const imageWrapper = document.createElement('div');
    imageWrapper.style.width = '100%';
    imageWrapper.style.height = '100%';
    imageWrapper.style.display = 'flex';
    imageWrapper.style.justifyContent = 'center';
    imageWrapper.style.alignItems = 'center';
    imageWrapper.style.position = 'relative';
    imageWrapper.style.overflow = 'auto'; // 允许滚动查看完整原始大小图片
    
    // 创建新的图片元素
    const fullscreenImage = new Image();
    fullscreenImage.src = imgElement.src;
    
    // 当图片加载完成后，根据屏幕尺寸调整到最佳显示大小
    fullscreenImage.onload = function() {
        // 获取屏幕可用尺寸（考虑浏览器工具栏等）
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // 计算图片比例和屏幕比例
        const imgRatio = fullscreenImage.naturalWidth / fullscreenImage.naturalHeight;
        const screenRatio = screenWidth / screenHeight;
        
        // 计算最佳缩放比例，确保图片尽可能大但不超出屏幕
        let scaleFactor;
        if (imgRatio > screenRatio) {
            // 图片较宽，以宽度为基准
            scaleFactor = (screenWidth * 0.9) / fullscreenImage.naturalWidth; // 留出10%边距
        } else {
            // 图片较高，以高度为基准
            scaleFactor = (screenHeight * 0.9) / fullscreenImage.naturalHeight; // 留出10%边距
        }
        
        // 应用缩放
        fullscreenImage.style.transform = `scale(${scaleFactor})`;
        fullscreenCurrentScale = scaleFactor;
    };
    
    // 设置图片样式
    fullscreenImage.style.width = fullscreenImage.naturalWidth || 'auto';
    fullscreenImage.style.height = fullscreenImage.naturalHeight || 'auto';
    fullscreenImage.style.transition = 'transform 0.3s ease';
    fullscreenImage.style.transformOrigin = 'center'; // 缩放原点设置为中心
    
    // 添加图片到容器
    imageWrapper.appendChild(fullscreenImage);
    
    // 使用全局缩放变量
    
    // 创建缩放信息提示
    const zoomInfo = document.createElement('div');
    zoomInfo.className = 'zoom-info';
    zoomInfo.textContent = '使用鼠标滚轮放大缩小（50%-150%），点击图片关闭';
    zoomInfo.style.position = 'absolute';
    zoomInfo.style.bottom = '20px';
    zoomInfo.style.left = '50%';
    zoomInfo.style.transform = 'translateX(-50%)';
    zoomInfo.style.color = 'white';
    zoomInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    zoomInfo.style.padding = '10px 20px';
    zoomInfo.style.borderRadius = '4px';
    zoomInfo.style.fontSize = '14px';
    zoomInfo.style.zIndex = '10';
    zoomInfo.style.pointerEvents = 'none';
    zoomInfo.style.opacity = '0.8';
    zoomInfo.style.transition = 'opacity 0.3s';
    
    fullscreenModal.appendChild(zoomInfo);
    
    // 添加鼠标滚轮缩放功能 - 直接绑定在图片上以确保稳定工作
    fullscreenImage.addEventListener('wheel', handleWheelZoom);
    
    // 同时也在容器上添加滚轮事件，确保在图片边缘也能缩放
    imageWrapper.addEventListener('wheel', handleWheelZoom);
    
    // 滚轮缩放处理函数
    function handleWheelZoom(e) {
        e.preventDefault(); // 阻止默认的滚动行为
        e.stopPropagation(); // 阻止事件冒泡
        
        // 计算缩放方向和增量
        const delta = e.deltaY > 0 ? -0.05 : 0.05; // 向上滚放大，向下滚缩小
        const newScale = fullscreenCurrentScale + delta;
        
        // 限制缩放范围
        if (newScale >= fullscreenMinScale && newScale <= fullscreenMaxScale) {
            fullscreenCurrentScale = newScale;
            fullscreenImage.style.transform = `scale(${fullscreenCurrentScale})`;
        }
    }
    
    // 点击图片关闭全屏
    imageWrapper.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡到模态框
        closeFullscreen();
    });
    
    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'fullscreen-close';
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '20px';
    closeButton.style.right = '30px';
    closeButton.style.color = 'white';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '40px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.cursor = 'pointer';
    closeButton.style.zIndex = '1001';
    closeButton.style.opacity = '0.7';
    closeButton.style.transition = 'opacity 0.3s';
    
    // 关闭按钮悬停效果
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.opacity = '1';
    });
    
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.opacity = '0.7';
    });
    
    // 添加关闭事件
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        closeFullscreen();
    });
    
    // 添加点击模态框关闭
    fullscreenModal.addEventListener('click', () => {
        closeFullscreen();
    });
    
    // 关闭全屏函数 - 统一处理关闭逻辑和事件清理
    function closeFullscreen() {
        if (fullscreenModal) {
            // 移除事件监听器
            fullscreenImage.removeEventListener('wheel', handleWheelZoom);
            imageWrapper.removeEventListener('wheel', handleWheelZoom);
            document.removeEventListener('keydown', handleEsc);
            
            // 移除模态框
            document.body.removeChild(fullscreenModal);
            fullscreenModal = null;
            
            // 恢复body样式
            document.body.style.overflow = '';
            document.body.style.backgroundColor = '';
        }
    }
    
    // 添加关闭按钮和图片容器到模态框
    fullscreenModal.appendChild(closeButton);
    fullscreenModal.appendChild(imageWrapper);
    
    // 添加键盘ESC关闭功能
    const handleEsc = (e) => {
        if (e.key === 'Escape' && fullscreenModal) {
            closeFullscreen();
        }
    };
    
    document.addEventListener('keydown', handleEsc);
    
    // 禁用body滚动
    document.body.style.overflow = 'hidden';
    
    // 添加模态框到body
    document.body.appendChild(fullscreenModal);
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
            
            // 保存到当前文件的设置
            if (selectedFileIndex !== -1 && uploadedFiles[selectedFileIndex]) {
                uploadedFiles[selectedFileIndex].watermarkType = radio.value;
            }
            
            if (uploadedImage) applyWatermarkToImage();
            
            // 只有勾选了"应用于所有图片"才同步到所有文件
            if (applyToAllImages.checked) {
                applySettingsToAllImages();
            }
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
                // 应用到所有图片
                if (applyToAllImages && applyToAllImages.checked) {
                    uploadedFiles.forEach(file => {
                        file.watermarkImage = img;
                    });
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    // 水印设置变化事件
    // 应用设置到所有图片的辅助函数
    function applySettingsToAllImages() {
        if (applyToAllImages && applyToAllImages.checked) {
            uploadedFiles.forEach(file => {
                // 应用当前的所有水印设置到每个文件
                file.watermarkType = getSelectedWatermarkType();
                file.watermarkText = watermarkText.value;
                file.watermarkColor = watermarkColor.value;
                file.watermarkOpacity = watermarkOpacity.value;
                file.watermarkSize = watermarkSize.value;
                file.watermarkPosition = watermarkPosition.value;
                file.watermarkDensity = watermarkDensity.value;
                
                // 对于非手动位置模式，清除自定义位置标记
                if (watermarkPosition.value !== 'manual') {
                    file.hasCustomPosition = false;
                }
                
                // 如果是手动位置模式，并且有当前归一化位置，则应用到所有文件
                if (watermarkPosition.value === 'manual' && canvas) {
                    const normalizedX = manualWatermarkX / canvas.width;
                    const normalizedY = manualWatermarkY / canvas.height;
                    file.normalizedWatermarkX = normalizedX;
                    file.normalizedWatermarkY = normalizedY;
                    file.hasCustomPosition = true;
                }
                
                // 同步水印图片
                if (file.watermarkType === 'image' && watermarkImage) {
                    file.watermarkImage = watermarkImage;
                }
            });
        }
    }
    
    watermarkOpacity.addEventListener('input', () => {
        opacityValue.textContent = `${watermarkOpacity.value}%`;
        
        // 保存到当前文件的设置
        if (selectedFileIndex !== -1 && uploadedFiles[selectedFileIndex]) {
            uploadedFiles[selectedFileIndex].watermarkOpacity = watermarkOpacity.value;
        }
        
        if (uploadedImage) applyWatermarkToImage();
        
        // 只有勾选了"应用于所有图片"才同步到所有文件
        if (applyToAllImages.checked) {
            applySettingsToAllImages();
        }
    });
    
    watermarkSize.addEventListener('input', () => {
        sizeValue.textContent = `${watermarkSize.value}px`;
        
        // 保存到当前文件的设置
        if (selectedFileIndex !== -1 && uploadedFiles[selectedFileIndex]) {
            uploadedFiles[selectedFileIndex].watermarkSize = watermarkSize.value;
        }
        
        if (uploadedImage) applyWatermarkToImage();
        
        // 只有勾选了"应用于所有图片"才同步到所有文件
        if (applyToAllImages.checked) {
            applySettingsToAllImages();
        }
    });
    
    watermarkText.addEventListener('input', () => {
        // 保存到当前文件的设置
        if (selectedFileIndex !== -1 && uploadedFiles[selectedFileIndex]) {
            uploadedFiles[selectedFileIndex].watermarkText = watermarkText.value;
        }
        
        if (uploadedImage) applyWatermarkToImage();
        
        // 只有勾选了"应用于所有图片"才同步到所有文件
        if (applyToAllImages.checked) {
            applySettingsToAllImages();
        }
    });
    
    watermarkColor.addEventListener('input', () => {
        // 保存到当前文件的设置
        if (selectedFileIndex !== -1 && uploadedFiles[selectedFileIndex]) {
            uploadedFiles[selectedFileIndex].watermarkColor = watermarkColor.value;
        }
        
        if (uploadedImage) applyWatermarkToImage();
        
        // 只有勾选了"应用于所有图片"才同步到所有文件
        if (applyToAllImages.checked) {
            applySettingsToAllImages();
        }
    });
    
    // 水印密度事件监听器
    watermarkDensity.addEventListener('input', () => {
        // 更新显示值
        densityValue.textContent = watermarkDensity.value;
        
        // 保存到当前文件的设置
        if (selectedFileIndex !== -1 && uploadedFiles[selectedFileIndex]) {
            uploadedFiles[selectedFileIndex].watermarkDensity = watermarkDensity.value;
        }
        
        if (uploadedImage) applyWatermarkToImage();
        
        // 只有勾选了"应用于所有图片"才同步到所有文件
        if (applyToAllImages.checked) {
            applySettingsToAllImages();
        }
    });
    
    watermarkPosition.addEventListener('change', () => {
        // 显示或隐藏手动定位提示信息
        if (watermarkPosition.value === 'manual') {
            manualPositionInfo.style.display = 'block';
        } else {
            manualPositionInfo.style.display = 'none';
        }
        
        // 显示或隐藏平铺稀疏度控件
        const watermarkDensityContainer = document.getElementById('watermarkDensityContainer');
        if (watermarkDensityContainer) {
            if (watermarkPosition.value === 'tiled') {
                watermarkDensityContainer.style.display = 'flex';
            } else {
                watermarkDensityContainer.style.display = 'none';
            }
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
                } else if (watermarkType === 'image' && watermarkImage) {
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
            // 保存到当前文件的设置
            if (selectedFileIndex !== -1 && uploadedFiles[selectedFileIndex]) {
                uploadedFiles[selectedFileIndex].watermarkPosition = watermarkPosition.value;
            }
            
            applyWatermarkToImage();
            
            // 只有勾选了"应用于所有图片"才同步到所有文件
            if (applyToAllImages.checked) {
                applySettingsToAllImages();
            }
        }
    });
    
    // 按钮点击事件 - 使用两个独立的下载按钮
    downloadCurrentImage.addEventListener('click', downloadSelectedImage);
    downloadAllImages.addEventListener('click', downloadAllSelectedImages);
}

// 处理图片上传
function handleImageUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // 限制单次上传图片数量为40张
    const MAX_UPLOAD_COUNT = 40;
    if (files.length > MAX_UPLOAD_COUNT) {
        // alert(`单次上传图片数量不能超过${MAX_UPLOAD_COUNT}张，请重新选择！`);
        e.target.value = ''; // 清空文件输入
        return;
    }
    
    // 禁用上传按钮，显示加载状态
    const uploadBtn = document.querySelector('.upload-btn');
    const uploadBtnText = document.getElementById('uploadBtnText');
    const uploadLoading = document.getElementById('uploadLoading');
    
    uploadBtn.style.opacity = '0.5';
    uploadBtn.style.cursor = 'not-allowed';
    uploadBtnText.style.display = 'none';
    uploadLoading.style.display = 'inline';
    
    // 清空现有的文件列表
    uploadedFiles = [];
    selectedFileIndex = -1;
    
    // 添加图片加载计数器
    let loadedImagesCount = 0;
    const totalImages = files.length;
    
    // 处理每个上传的文件
    Array.from(files).forEach((file, index) => {
        if (!file.type.match('image.*')) {
            loadedImagesCount++;
            checkAllImagesLoaded();
            return;
        }
        
        // 保存文件信息
        const fileName = file.name;
        const fileSize = (file.size / 1024).toFixed(2) + ' KB';
        
        // 解析文件名，分离文件名和扩展名
        const nameParts = fileName.split('.');
        const fileExtension = nameParts.length > 1 ? nameParts.pop().toLowerCase() : '';
        const nameWithoutExt = nameParts.join('.') || fileName;
        
        // 确定图片的MIME类型
        let imageFormat;
        if (fileExtension === 'png') {
            imageFormat = 'image/png';
        } else if (fileExtension === 'webp') {
            imageFormat = 'image/webp';
        } else if (fileExtension === 'svg') {
            imageFormat = 'image/svg+xml';
        } else {
            // 对于其他格式（jpg、jpeg等），默认使用jpeg
            imageFormat = 'image/jpeg';
        }
        
        // 创建文件信息对象，包含独立的水印配置
        const fileInfo = {
            index,
            file,
            name: fileName,
            nameWithoutExt,
            extension: fileExtension, // 添加扩展名属性用于批量处理
            format: imageFormat,
            size: fileSize,
            image: null,
            width: 0,
            height: 0,
            dataUrl: null,
            // 初始化独立的水印配置
            watermarkType: null, // 初始化为null，等待selectFile函数设置
            watermarkText: null,
            watermarkColor: null,
            watermarkOpacity: null,
            watermarkSize: null,
            watermarkPosition: null,
            watermarkDensity: null, // 添加平铺稀疏度属性
            // 位置相关属性
            watermarkX: null,
            watermarkY: null,
            normalizedWatermarkX: null,
            normalizedWatermarkY: null,
            hasCustomPosition: false
        };
        
        uploadedFiles.push(fileInfo);
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // 更新文件信息
                fileInfo.image = img;
                fileInfo.width = img.width;
                fileInfo.height = img.height;
                fileInfo.dataUrl = event.target.result;
                
                // 更新文件列表显示
                renderFileList();
                
                // 只有当前图片是第一个文件时，才自动选中并预览
                if (index === 0) {
                    selectedFileIndex = 0;
                    selectFile(0);
                    
                    // 同时更新全局变量，保持与原有功能兼容
                    uploadedImage = img;
                    originalImageWidth = img.width;
                    originalImageHeight = img.height;
                    originalImageFormat = imageFormat;
                    originalFileName = nameWithoutExt;
                }
                
                // 增加已加载图片计数并检查是否全部加载完成
                loadedImagesCount++;
                checkAllImagesLoaded();
            };
            
            img.onerror = function() {
                console.error('无法加载图像文件');
                loadedImagesCount++;
                checkAllImagesLoaded();
            };
            
            img.src = event.target.result;
        };
        
        reader.onerror = function() {
            console.error('文件读取错误');
            loadedImagesCount++;
            checkAllImagesLoaded();
        };
        
        reader.readAsDataURL(file);
    });
    
    // 检查是否所有图片都已加载完成
    function checkAllImagesLoaded() {
        if (loadedImagesCount >= totalImages) {
            // 所有图片加载完成，恢复上传按钮状态
            const uploadBtn = document.querySelector('.upload-btn');
            const uploadBtnText = document.getElementById('uploadBtnText');
            const uploadLoading = document.getElementById('uploadLoading');
            
            uploadBtn.style.opacity = '1';
            uploadBtn.style.cursor = 'pointer';
            uploadBtnText.style.display = 'inline';
            uploadLoading.style.display = 'none';
        }
    }
    
    // 清空文件输入，允许重新选择相同文件
    e.target.value = '';
}

// 渲染文件列表
function renderFileList() {
    const fileListElement = document.getElementById('fileList');
    
    if (uploadedFiles.length === 0) {
        fileListElement.innerHTML = '<div class="file-list-empty">请上传图片以显示文件列表</div>';
        return;
    }
    
    // 创建网格容器
    const gridContainer = document.createElement('div');
    gridContainer.className = 'file-grid';
    
    // 为每个文件创建列表项
    uploadedFiles.forEach((fileInfo, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = `file-item ${index === selectedFileIndex ? 'selected' : ''}`;
        fileItem.dataset.index = index;
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = fileInfo.name;
        
        const fileSize = document.createElement('div');
        fileSize.className = 'file-size';
        fileSize.textContent = fileInfo.size;
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(fileSize);
        
        // 添加点击事件
        fileItem.addEventListener('click', () => selectFile(index));
        
        gridContainer.appendChild(fileItem);
    });
    
    fileListElement.innerHTML = '';
    fileListElement.appendChild(gridContainer);
}

// 选择文件并预览
function selectFile(index) {
    if (index < 0 || index >= uploadedFiles.length) return;
    
    const fileInfo = uploadedFiles[index];
    if (!fileInfo.image) return;
    
    // 保存当前文件的水印设置
    if (canvas && selectedFileIndex >= 0 && selectedFileIndex < uploadedFiles.length) {
        // 转换为归一化坐标并保存
        const normalizedX = manualWatermarkX / canvas.width;
        const normalizedY = manualWatermarkY / canvas.height;
        uploadedFiles[selectedFileIndex].normalizedWatermarkX = normalizedX;
        uploadedFiles[selectedFileIndex].normalizedWatermarkY = normalizedY;
        uploadedFiles[selectedFileIndex].hasCustomPosition = true; // 标记该文件有自定义位置
        
        // 保存所有水印设置
        uploadedFiles[selectedFileIndex].watermarkType = getSelectedWatermarkType();
        uploadedFiles[selectedFileIndex].watermarkText = watermarkText.value;
        uploadedFiles[selectedFileIndex].watermarkColor = watermarkColor.value;
        uploadedFiles[selectedFileIndex].watermarkOpacity = watermarkOpacity.value;
        uploadedFiles[selectedFileIndex].watermarkSize = watermarkSize.value;
        uploadedFiles[selectedFileIndex].watermarkPosition = watermarkPosition.value;
        uploadedFiles[selectedFileIndex].watermarkDensity = watermarkDensity.value;
        
        // 保留原始坐标用于兼容性
        uploadedFiles[selectedFileIndex].watermarkX = manualWatermarkX;
        uploadedFiles[selectedFileIndex].watermarkY = manualWatermarkY;
    }
    
    // 更新选中索引
    selectedFileIndex = index;
    
    // 更新全局变量
    uploadedImage = fileInfo.image;
    originalImageWidth = fileInfo.width;
    originalImageHeight = fileInfo.height;
    originalFileName = fileInfo.nameWithoutExt;
    originalImageFormat = fileInfo.format;
    
    // 创建Canvas并预览
    createCanvas(fileInfo.width, fileInfo.height);
    
    // 恢复该文件的水印设置
    // 如果文件是第一次被选中（没有保存的水印配置），则根据"应用于所有图片"的状态决定使用全局设置还是默认设置
    if (fileInfo.watermarkType === null) {
        // 只有勾选了"应用于所有图片"才复制当前全局设置，否则使用默认值
        if (applyToAllImages && applyToAllImages.checked) {
            // 复制当前全局设置作为该文件的独立配置
            fileInfo.watermarkType = getSelectedWatermarkType();
            fileInfo.watermarkText = watermarkText.value;
            fileInfo.watermarkColor = watermarkColor.value;
            fileInfo.watermarkOpacity = watermarkOpacity.value;
            fileInfo.watermarkSize = watermarkSize.value;
            fileInfo.watermarkPosition = watermarkPosition.value;
            fileInfo.watermarkDensity = watermarkDensity.value;
        } else {
            // 使用默认设置
            fileInfo.watermarkType = 'text';
            fileInfo.watermarkText = '水印';
            fileInfo.watermarkColor = '#000000';
            fileInfo.watermarkOpacity = 30;
            fileInfo.watermarkSize = 30;
            fileInfo.watermarkPosition = 'bottom-right';
            fileInfo.watermarkDensity = 5;
        }
    }
    
    // 1. 水印类型
    const typeRadios = document.querySelectorAll('input[name="watermarkType"]');
    for (let radio of typeRadios) {
        if (radio.value === fileInfo.watermarkType) {
            radio.checked = true;
            // 触发change事件
            const event = new Event('change');
            radio.dispatchEvent(event);
            break;
        }
    }
    
    // 2. 水印文本
    watermarkText.value = fileInfo.watermarkText || '水印';
    
    // 3. 水印颜色
    watermarkColor.value = fileInfo.watermarkColor || '#000000';
    
    // 4. 水印透明度
    watermarkOpacity.value = fileInfo.watermarkOpacity || 30;
    // 更新透明度显示值
    const opacityValue = document.getElementById('opacityValue');
    if (opacityValue) {
        opacityValue.textContent = fileInfo.watermarkOpacity || 30;
    }
    
    // 5. 水印大小
    watermarkSize.value = fileInfo.watermarkSize || 30;
    // 更新大小显示值
    const sizeValue = document.getElementById('sizeValue');
    if (sizeValue) {
        sizeValue.textContent = fileInfo.watermarkSize || 30;
    }
    
    // 6. 水印位置模式
    const prevValue = watermarkPosition.value;
    watermarkPosition.value = fileInfo.watermarkPosition || 'bottom-right';
    
    // 如果值改变了，触发change事件
    if (prevValue !== fileInfo.watermarkPosition) {
        const event = new Event('change');
        watermarkPosition.dispatchEvent(event);
    }
    
    // 7. 平铺稀疏度
    const prevDensity = watermarkDensity.value;
    watermarkDensity.value = fileInfo.watermarkDensity || 5;
    // 更新稀疏度显示值
    const densityValue = document.getElementById('densityValue');
    if (densityValue) {
        densityValue.textContent = fileInfo.watermarkDensity || 5;
    }
    
    // 如果值改变了，触发change事件
    if (prevDensity !== fileInfo.watermarkDensity) {
        const event = new Event('change');
        watermarkDensity.dispatchEvent(event);
    }
    
    // 如果当前是手动定位模式
    if (watermarkPosition.value === 'manual') {
        // 检查是否有该文件的保存水印位置（优先使用归一化坐标）
        if (fileInfo.hasCustomPosition && fileInfo.normalizedWatermarkX !== undefined && fileInfo.normalizedWatermarkY !== undefined) {
            // 使用归一化坐标计算预览中的实际位置（优化的归一化坐标算法）
            // 计算水印大小，用于边界限制
            const baseDiagonalLength = 1000;
            const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
            const diagonalRatio = diagonal / baseDiagonalLength;
            const baseSize = parseInt(watermarkSize.value);
            const size = Math.round(baseSize * Math.pow(diagonalRatio, 0.75));
            
            // 获取水印类型
            const watermarkType = getSelectedWatermarkType();
            
            // 计算边界限制，确保水印位置在新图片中也不会超出边界
            let minX, maxX, minY, maxY;
            if (watermarkType === 'text') {
                ctx.save();
                ctx.font = `${size}px Arial`;
                const textWidth = ctx.measureText(watermarkText.value || '水印').width;
                ctx.restore();
                
                minX = textWidth / 2;
                maxX = canvas.width - textWidth / 2;
                minY = size / 2;
                maxY = canvas.height - size / 2;
            } else {
                minX = size / 2;
                maxX = canvas.width - size / 2;
                minY = size / 2;
                maxY = canvas.height - size / 2;
            }
            
            // 应用归一化坐标并确保在边界内
            manualWatermarkX = Math.max(minX, Math.min(maxX, fileInfo.normalizedWatermarkX * canvas.width));
            manualWatermarkY = Math.max(minY, Math.min(maxY, fileInfo.normalizedWatermarkY * canvas.height));
        } else if (fileInfo.hasCustomPosition && fileInfo.watermarkX !== undefined && fileInfo.watermarkY !== undefined) {
            // 兼容旧的绝对坐标，但也进行边界检查
            // 计算水印大小
            const baseDiagonalLength = 1000;
            const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
            const diagonalRatio = diagonal / baseDiagonalLength;
            const baseSize = parseInt(watermarkSize.value);
            const size = Math.round(baseSize * Math.pow(diagonalRatio, 0.75));
            
            // 计算边界限制
            let minX = size / 2;
            let maxX = canvas.width - size / 2;
            let minY = size / 2;
            let maxY = canvas.height - size / 2;
            
            // 确保坐标在边界内
            manualWatermarkX = Math.max(minX, Math.min(maxX, fileInfo.watermarkX));
            manualWatermarkY = Math.max(minY, Math.min(maxY, fileInfo.watermarkY));
        } else {
            // 默认将水印放在左上角，确保水印部分可见
            // 计算水印大小用于合理定位
            const baseDiagonalLength = 1000;
            const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
            const diagonalRatio = diagonal / baseDiagonalLength;
            const baseSize = parseInt(watermarkSize.value);
            const size = Math.round(baseSize * Math.pow(diagonalRatio, 0.75));
            
            // 左上角位置，给一点边距
            manualWatermarkX = size / 2 + 20; // 左侧保留水印一半宽度加20px边距
            manualWatermarkY = size / 2 + 20; // 顶部保留水印一半高度加20px边距
            
            // 保存归一化坐标到文件信息中
            fileInfo.normalizedWatermarkX = manualWatermarkX / canvas.width;
            fileInfo.normalizedWatermarkY = manualWatermarkY / canvas.height;
            // 注意：这里不设置hasCustomPosition，让用户拖动后才标记为自定义位置
            
            // 保留原始坐标用于兼容性
            fileInfo.watermarkX = manualWatermarkX;
            fileInfo.watermarkY = manualWatermarkY;
        }
    }
    
    applyWatermarkToImage();
    
    // 更新文件列表显示
    renderFileList();
    
    // 启用下载按钮
    downloadCurrentImage.disabled = false;
    downloadAllImages.disabled = false;
}

// 创建Canvas元素
function createCanvas(width, height) {
    // 简化方案：清空previewContainer中的所有子元素
    if (previewContainer) {
        // 移除previewContainer中的所有子元素
        while (previewContainer.firstChild) {
            previewContainer.removeChild(previewContainer.firstChild);
        }
    }
    
    // 获取视口可用空间，动态调整预览大小
    const viewportWidth = window.innerWidth * 0.9;  // 90%视口宽度
    const viewportHeight = window.innerHeight * 0.7; // 70%视口高度
    
    // 设置合理的最大尺寸限制
    const maxWidth = Math.min(1200, viewportWidth);  // 最大宽度1200px或视口宽度的90%
    const maxHeight = Math.min(900, viewportHeight); // 最大高度900px或视口高度的70%
    
    // 计算调整后的图像尺寸，保持原始宽高比
    let newWidth = width;
    let newHeight = height;
    
    // 如果图像尺寸大于最大限制，按比例缩小
    if (width > maxWidth || height > maxHeight) {
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const scaleRatio = Math.min(widthRatio, heightRatio);
        
        newWidth = Math.floor(width * scaleRatio);
        newHeight = Math.floor(height * scaleRatio);
    }
    
    // 动态调整预览容器的最小尺寸，确保能够完整显示图片
    previewContainer.style.minHeight = Math.max(200, newHeight + 20) + 'px';
    
    // 创建图片容器，用于容纳canvas和放大图标
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-preview-container';
    imageContainer.style.position = 'relative';
    imageContainer.style.display = 'inline-block';
    imageContainer.style.cursor = 'zoom-in';
    
    // 创建新的Canvas
    canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx = canvas.getContext('2d');
    
    // 设置Canvas样式，确保在容器中居中显示
    canvas.style.display = 'block';
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
    canvas.style.height = 'auto';
    canvas.style.width = 'auto';
    
    // 将canvas添加到imageContainer，然后将imageContainer添加到预览容器中
    imageContainer.appendChild(canvas);
    if (previewContainer) {
        previewContainer.appendChild(imageContainer);
    }
    
    // 添加小型放大镜图标
    const zoomIcon = document.createElement('div');
    zoomIcon.className = 'zoom-icon';
    zoomIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    `;
    zoomIcon.style.position = 'absolute';
    zoomIcon.style.top = '5px';
    zoomIcon.style.right = '5px';
    zoomIcon.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'; // 降低透明度
    zoomIcon.style.color = '#333';
    zoomIcon.style.borderRadius = '50%';
    zoomIcon.style.padding = '4px';
    zoomIcon.style.opacity = '0';
    zoomIcon.style.transition = 'opacity 0.3s ease';
    zoomIcon.style.pointerEvents = 'none';
    zoomIcon.style.zIndex = '10';
    
    // 将canvas和放大图标添加到容器中
    imageContainer.appendChild(canvas);
    imageContainer.appendChild(zoomIcon);
    
    // 清空预览容器并添加图片容器
    previewContainer.innerHTML = '';
    previewContainer.appendChild(imageContainer);
    
    // 添加悬浮显示/隐藏放大图标的事件
    imageContainer.addEventListener('mouseenter', () => {
        zoomIcon.style.opacity = '1';
    });
    
    imageContainer.addEventListener('mouseleave', () => {
        zoomIcon.style.opacity = '0';
    });
    
    // 添加提示文本
    const zoomHint = document.createElement('div');
    zoomHint.className = 'zoom-hint';
    zoomHint.textContent = '双击放大';
    zoomHint.style.position = 'absolute';
    zoomHint.style.bottom = '10px';
    zoomHint.style.left = '50%';
    zoomHint.style.transform = 'translateX(-50%)';
    zoomHint.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    zoomHint.style.color = 'white';
    zoomHint.style.padding = '5px 10px';
    zoomHint.style.borderRadius = '4px';
    zoomHint.style.fontSize = '12px';
    zoomHint.style.opacity = '0';
    zoomHint.style.transition = 'opacity 0.3s ease';
    zoomHint.style.pointerEvents = 'none';
    zoomHint.style.zIndex = '10';
    
    // 将提示文本添加到容器中
    imageContainer.appendChild(zoomHint);
    
    // 更新悬浮事件以同时显示图标和提示
    imageContainer.addEventListener('mouseenter', () => {
        zoomIcon.style.opacity = '1';
        zoomHint.style.opacity = '1';
    });
    
    imageContainer.addEventListener('mouseleave', () => {
        zoomIcon.style.opacity = '0';
        zoomHint.style.opacity = '0';
    });
    
    // 添加双击放大事件
    imageContainer.addEventListener('dblclick', () => {
        // 使用Canvas的数据URL而不是原始图片，这样就能显示水印
        const imageWithWatermark = new Image();
        imageWithWatermark.src = canvas.toDataURL();
        zoomImageFullscreen(imageWithWatermark);
    });
    
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
    if (width > maxWidth || height > maxHeight) {
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
        // 计算水印大小，用于边界限制
        const baseDiagonalLength = 1000;
        const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
        const diagonalRatio = diagonal / baseDiagonalLength;
        const baseSize = parseInt(watermarkSize.value);
        const size = Math.round(baseSize * Math.pow(diagonalRatio, 0.75));
        
        // 获取水印类型
        const watermarkType = getSelectedWatermarkType();
        
        // 根据水印类型计算边界限制
        let minX, maxX, minY, maxY;
        if (watermarkType === 'text') {
            // 文字水印：需要考虑文本宽度
            ctx.save();
            ctx.font = `${size}px Arial`;
            const textWidth = ctx.measureText(watermarkText.value || '水印').width;
            ctx.restore();
            
            minX = textWidth / 2;
            maxX = canvas.width - textWidth / 2;
            minY = size / 2;
            maxY = canvas.height - size / 2;
        } else {
            // 图片水印：直接使用水印尺寸
            minX = size / 2;
            maxX = canvas.width - size / 2;
            minY = size / 2;
            maxY = canvas.height - size / 2;
        }
        
        // 计算新的水印位置并确保不超出边界
        const newX = Math.max(minX, Math.min(maxX, x - dragOffsetX));
        const newY = Math.max(minY, Math.min(maxY, y - dragOffsetY));
        
        // 更新水印位置
        manualWatermarkX = newX;
        manualWatermarkY = newY;
        
        // 如果启用了"应用于所有图片"，则更新所有图片的水印位置和其他设置
                        if (applyToAllImages && applyToAllImages.checked) {
                            // 计算归一化坐标（相对于Canvas的比例）
                            const normalizedX = newX / canvas.width;
                            const normalizedY = newY / canvas.height;
                            
                            // 更新所有文件的水印位置和设置
                            uploadedFiles.forEach(file => {
                                file.normalizedWatermarkX = normalizedX;
                                file.normalizedWatermarkY = normalizedY;
                                file.hasCustomPosition = true;
                                file.watermarkPosition = 'manual'; // 确保设置为手动位置模式
                                // 同时应用其他设置
                                file.watermarkOpacity = watermarkOpacity.value;
                                file.watermarkSize = watermarkSize.value;
                                file.watermarkText = watermarkText.value;
                                file.watermarkColor = watermarkColor.value;
                                file.watermarkType = getSelectedWatermarkType();
                            });
                        }
        
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
        
        // 保存当前文件的水印位置
        if (selectedFileIndex >= 0 && selectedFileIndex < uploadedFiles.length) {
            // 转换为归一化坐标（相对位置，0-1范围）
            const normalizedX = manualWatermarkX / canvas.width;
            const normalizedY = manualWatermarkY / canvas.height;
            
            // 获取当前所有水印设置
            const currentWatermarkType = getSelectedWatermarkType();
            const currentWatermarkText = watermarkText.value;
            const currentWatermarkColor = watermarkColor.value;
            const currentWatermarkOpacity = watermarkOpacity.value;
            const currentWatermarkSize = watermarkSize.value;
            const currentWatermarkPosition = watermarkPosition.value;
            
            // 如果启用了"应用于所有图片"，将所有设置应用到所有文件
            if (applyToAllImages && applyToAllImages.checked) {
                uploadedFiles.forEach(file => {
                    // 更新位置设置
                    file.normalizedWatermarkX = normalizedX;
                    file.normalizedWatermarkY = normalizedY;
                    file.hasCustomPosition = true;
                    file.watermarkPosition = 'manual'; // 拖动时始终设置为手动位置
                    
                    // 更新其他所有水印设置
                    file.watermarkType = currentWatermarkType;
                    file.watermarkText = currentWatermarkText;
                    file.watermarkColor = currentWatermarkColor;
                    file.watermarkOpacity = currentWatermarkOpacity;
                    file.watermarkSize = currentWatermarkSize;
                    
                    // 保留原始坐标用于兼容性
                    file.watermarkX = manualWatermarkX;
                    file.watermarkY = manualWatermarkY;
                });
            } else {
                // 如果没有启用"应用于所有图片"，则只更新当前文件
                uploadedFiles[selectedFileIndex].normalizedWatermarkX = normalizedX;
                uploadedFiles[selectedFileIndex].normalizedWatermarkY = normalizedY;
                uploadedFiles[selectedFileIndex].hasCustomPosition = true;
                uploadedFiles[selectedFileIndex].watermarkPosition = 'manual';
                
                // 保留原始坐标用于兼容性
                uploadedFiles[selectedFileIndex].watermarkX = manualWatermarkX;
                uploadedFiles[selectedFileIndex].watermarkY = manualWatermarkY;
            }
        }
        
        // 重新绘制水印，移除拖动指示器
        applyWatermarkToImage();
    }
}

// 应用水印到图片
// 公共方法：计算水印大小
function calculateWatermarkSize(imageWidth, imageHeight, baseSizeValue) {
    // 设置统一的基础对角线长度
    const baseDiagonalLength = 1000;
    const diagonal = Math.sqrt(imageWidth * imageWidth + imageHeight * imageHeight);
    const diagonalRatio = diagonal / baseDiagonalLength;
    
    // 计算水印大小 - 进一步增加幂次系数至1.0，使水印大小显著增大
    const baseSize = parseInt(baseSizeValue);
    let finalSize = Math.round(baseSize * Math.pow(diagonalRatio, 1.0));
    
    // 根据图片宽高比动态调整水印大小
    // 对于宽大于高的图片，适当减小水印大小，使水印比例更加协调
    const aspectRatio = imageWidth / imageHeight;
    if (aspectRatio > 1.5) { // 宽屏图片（宽大于高的1.5倍）
        // 宽高比越大，水印大小调整系数越小，但保持一定比例
        const widthAdjustmentFactor = 1 / Math.pow(aspectRatio, 0.3); // 使用0.3次方使调整更平滑
        finalSize = Math.round(finalSize * widthAdjustmentFactor);
    }
    
    // 添加合理的限制，防止水印过大或过小
    // 进一步增加最大值限制至22%，使水印更加明显可见
    finalSize = Math.min(finalSize, Math.max(imageWidth, imageHeight) * 0.22);
    finalSize = Math.max(finalSize, 12); // 大幅提高最小尺寸至12px，确保水印清晰可见
    
    return finalSize;
}

// 公共方法：计算预览缩放比例
function calculatePreviewScale(imageWidth, imageHeight, maxPreviewSize = 500) {
    let actualScale = 1;
    if (imageWidth > maxPreviewSize || imageHeight > maxPreviewSize) {
        // 计算正确的缩放比例：预览大小 / 原始大小
        const widthRatio = maxPreviewSize / imageWidth;
        const heightRatio = maxPreviewSize / imageHeight;
        // 使用较小的比例因子以确保图像完全适应预览区域
        actualScale = Math.min(widthRatio, heightRatio);
    }
    return actualScale;
}

function applyWatermarkToImage() {
    if (!uploadedImage || !ctx || !imageCacheCanvas) return;
    
    // 清空Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 使用缓存的原始图像，避免重复绘制原图
    ctx.drawImage(imageCacheCanvas, 0, 0);
    
    // 获取当前选中的文件信息
    const currentFile = selectedFileIndex >= 0 ? uploadedFiles[selectedFileIndex] : null;
    
    // 获取水印设置 - 优先使用文件自己保存的设置，如果没有则使用全局设置
    const watermarkType = currentFile && currentFile.watermarkType ? currentFile.watermarkType : getSelectedWatermarkType();
    const text = currentFile && currentFile.watermarkText ? currentFile.watermarkText : (watermarkType === 'text' ? watermarkText.value : '水印');
    const color = currentFile && currentFile.watermarkColor ? currentFile.watermarkColor : (watermarkType === 'text' ? watermarkColor.value : '#000000');
    const opacity = currentFile && currentFile.watermarkOpacity !== undefined ? currentFile.watermarkOpacity / 100 : watermarkOpacity.value / 100;
    const position = currentFile && currentFile.watermarkPosition ? currentFile.watermarkPosition : watermarkPosition.value;
    const watermarkSizeValue = currentFile && currentFile.watermarkSize !== undefined ? currentFile.watermarkSize : watermarkSize.value;
    
    // 使用Canvas实际宽度和原始图像宽度的比例作为预览缩放比例
    // 这样可以确保水印大小的计算与Canvas的实际缩放完全一致
    const previewScale = canvas.width / originalImageWidth;
    
    // 计算原始水印大小
    const originalSize = calculateWatermarkSize(originalImageWidth, originalImageHeight, watermarkSizeValue);
    
    // 根据预览缩放比例调整水印大小，确保预览和下载时的水印比例一致
    let size = originalSize * previewScale;
    
    // 保存当前Canvas状态，包括globalAlpha
    ctx.save();
    
    // 设置水印透明度
    ctx.globalAlpha = opacity;
    
    // 根据水印类型应用不同的水印
    if (watermarkType === 'text') {
        // 文字水印
        
        // 将文字水印大小乘以1.5倍
        const textWatermarkSize = size * 1.5;
        
        // 设置水印样式
        ctx.fillStyle = color;
        ctx.font = `${textWatermarkSize}px Arial`;
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
                    ctx.strokeRect(manualWatermarkX - textWidth/2 - 5, manualWatermarkY - textWatermarkSize/2 - 5, textWidth + 10, textWatermarkSize + 10);
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
                // 保存当前文本样式
                const currentFillStyle = ctx.fillStyle;
                applyTiledWatermark(text, color, textWatermarkSize);
                // 恢复文本样式
                ctx.fillStyle = currentFillStyle;
                break;
        }
    } else if (watermarkType === 'image' && watermarkImage) {
        // 图片水印
        // 根据图像大小和水印大小计算合适的边距，确保水印不会超出边界
        const safeMargin = Math.min(20, Math.max(canvas.width, canvas.height) * 0.05);
        
        // 将图片水印大小乘以1.8倍，与下载后保持一致
        const imageWatermarkSize = size * 1.8;
        
        // 根据位置应用图片水印
        switch(position) {
            case 'manual':
                // 手动位置模式
                ctx.drawImage(watermarkImage, manualWatermarkX - imageWatermarkSize/2, manualWatermarkY - imageWatermarkSize/2, imageWatermarkSize, imageWatermarkSize);
                
                // 如果鼠标悬停在水印上，绘制拖动指示器
                if (isWatermarkOverlapping) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(manualWatermarkX - imageWatermarkSize/2 - 5, manualWatermarkY - imageWatermarkSize/2 - 5, imageWatermarkSize + 10, imageWatermarkSize + 10);
                }
                break;
            case 'top-left':
                ctx.drawImage(watermarkImage, safeMargin, safeMargin, imageWatermarkSize, imageWatermarkSize);
                break;
            case 'top-right':
                ctx.drawImage(watermarkImage, canvas.width - imageWatermarkSize - safeMargin, safeMargin, imageWatermarkSize, imageWatermarkSize);
                break;
            case 'bottom-left':
                ctx.drawImage(watermarkImage, safeMargin, canvas.height - imageWatermarkSize - safeMargin, imageWatermarkSize, imageWatermarkSize);
                break;
            case 'bottom-right':
                ctx.drawImage(watermarkImage, canvas.width - imageWatermarkSize - safeMargin, canvas.height - imageWatermarkSize - safeMargin, imageWatermarkSize, imageWatermarkSize);
                break;
            case 'center':
                ctx.drawImage(watermarkImage, (canvas.width - imageWatermarkSize) / 2, (canvas.height - imageWatermarkSize) / 2, imageWatermarkSize, imageWatermarkSize);
                break;
            case 'tiled':
                // 保存当前透明度设置
                const currentAlpha = ctx.globalAlpha;
                applyTiledImageWatermark(imageWatermarkSize);
                // 恢复透明度设置
                ctx.globalAlpha = currentAlpha;
                break;
        }
    }
    
    // 恢复Canvas状态，确保globalAlpha等设置不会影响后续绘制
    ctx.restore();
}

// 应用平铺水印
function applyTiledWatermark(text, color, size) {
    const angle = -Math.PI / 6; // 45度角（弧度）
    
    // 获取当前的稀疏度值，默认5
    const density = parseInt(watermarkDensity.value) || 5;
    
    // 保存当前状态
    ctx.save();
    
    // 设置文本颜色为传入的颜色参数
    ctx.fillStyle = color;
    
    // 计算水印文本的宽度
    const textWidth = ctx.measureText(text).width;
    
    // 分离横向和纵向间距计算
    // 横向间距与文字宽度相关，确保不会重合
    // 纵向间距只与文字大小相关，且变化幅度小
    // 使用稀疏度参数调整间距，值越大间距越大
    const horizontalGap = textWidth * (1.6 + (density - 5) * 0.2); // 横向间距与文字宽度和稀疏度相关
    const verticalGap = size * (5 + (density - 5) * 0.4); // 纵向间距与文字大小和稀疏度相关
    // 获取Canvas的对角线长度，用于计算水印范围
    const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    
    // 计算实际需要绘制的水印数量
    const count = Math.ceil(diagonal / (horizontalGap * 0.6)); // 使用较小的系数确保完全覆盖
    
    // 移动到Canvas中心并旋转
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    
    // 计算绘制范围，确保水印不会超出图像边界
    const drawRange = diagonal * 0.6; // 稍微缩小绘制范围
    
    // 绘制平铺水印
    for (let i = -count; i < count; i++) {
        for (let j = -count; j < count; j++) {
            const x = i * horizontalGap;
            const y = j * verticalGap;
            
            // 只绘制在图像边界内的水印
            if (Math.abs(x) < drawRange && Math.abs(y) < drawRange) {
                ctx.fillText(text, x, y);
            }
        }
    }
    
    // 恢复Canvas状态
    ctx.restore();
}

// 应用平铺图片水印
function applyTiledImageWatermark(size) {
    if (!watermarkImage) return;
    
    const angle = -Math.PI / 6; // 45度角（弧度）
    
    // 获取当前的稀疏度值，默认5
    const density = parseInt(watermarkDensity.value) || 5;
    
    // 保存当前状态
    ctx.save();
    
    // 根据水印大小、图像比例和稀疏度参数动态计算间距
    const baseGap = Math.max(size * 1.5, Math.max(canvas.width, canvas.height) / 6);
    const gap = baseGap * (1 + (density - 5) * 0.1); // 稀疏度值越大，间距越大
    
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
function applyTiledWatermarkToOriginal(ctx, text, color, size, density, width, height) {
    // 设置水印样式
    ctx.font = `${size}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 使用传入的稀疏度值，默认5
    const actualDensity = parseInt(density) || 5;
    
    // 保存当前状态
    ctx.save();
    
    // 计算水印文本的宽度
    const textWidth = ctx.measureText(text).width;
    
    // 分离横向和纵向间距计算
    // 横向间距与文字宽度相关，确保不会重合
    // 纵向间距只与文字大小相关，且变化幅度小
    // 使用稀疏度参数调整间距，值越大间距越大
    const horizontalGap = textWidth * (1.6 + (actualDensity - 5) * 0.2); // 横向间距与文字宽度和稀疏度相关
    const verticalGap = size * (5 + (actualDensity - 5) * 0.4); // 纵向间距与文字大小和稀疏度相关
    
    // 获取Canvas的对角线长度，用于计算水印范围
    const diagonal = Math.sqrt(width * width + height * height);
    
    // 计算实际需要绘制的水印数量
    const count = Math.ceil(diagonal / (horizontalGap * 0.6)); // 使用较小的系数确保完全覆盖
    
    // 移动到Canvas中心并旋转
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 6); // -30度角
    
    // 计算绘制范围，确保水印不会超出图像边界
    const drawRange = diagonal * 0.6; // 稍微缩小绘制范围
    
    // 坐标系统已在前面平移
    
    // 绘制平铺水印
    for (let i = -count; i < count; i++) {
        for (let j = -count; j < count; j++) {
            const x = i * horizontalGap;
            const y = j * verticalGap;
            
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
function applyTiledImageWatermarkToOriginal(ctx, size, density, width, height) {
    if (!watermarkImage) return;
    
    // 使用传入的稀疏度值，默认5
    const actualDensity = parseInt(density) || 5;
    
    // 保存状态
    ctx.save();
    
    // 首先移动到Canvas中心
    ctx.translate(width / 2, height / 2);
    
    // 然后旋转水印
    ctx.rotate(-Math.PI / 6); // -30度角
    
    // 使用与预览相同的间距计算逻辑，但针对原始尺寸
    const baseGap = Math.max(size * 1.5, Math.max(width, height) / 6);
    const gap = baseGap * (1 + (actualDensity - 5) * 0.1); // 稀疏度值越大，间距越大
    
    // 获取Canvas的对角线长度，确保水印覆盖整个图像
    const diagonal = Math.sqrt(width * width + height * height);
    
    // 计算需要绘制的水印数量
    const count = Math.ceil(diagonal / (gap * 0.8)); // 使用较小的系数确保完全覆盖
    
    // 计算绘制范围
    const drawRange = diagonal * 0.7; // 增大绘制范围以确保完全覆盖
    
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

// 为单个文件应用水印并返回处理后的Blob
function applyWatermarkToFile(fileInfo) {
    return new Promise((resolve) => {
        const img = fileInfo.image;
        const originalWidth = fileInfo.width;
        const originalHeight = fileInfo.height;
        
        // 创建临时Canvas用于生成下载图像
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 在临时Canvas上绘制原始图像
        tempCtx.drawImage(img, 0, 0);
        
        // 获取水印设置 - 优先使用文件自己保存的设置，如果没有则使用全局设置
        const watermarkType = fileInfo.watermarkType || getSelectedWatermarkType();
        const text = fileInfo.watermarkText || (watermarkType === 'text' ? watermarkText.value : '水印');
        const color = fileInfo.watermarkColor || (watermarkType === 'text' ? watermarkColor.value : '#000000');
        const opacity = (fileInfo.watermarkOpacity !== undefined ? fileInfo.watermarkOpacity : watermarkOpacity.value) / 100;
        const previewSize = parseInt(fileInfo.watermarkSize !== undefined ? fileInfo.watermarkSize : watermarkSize.value);
        const position = fileInfo.watermarkPosition !== undefined ? fileInfo.watermarkPosition : watermarkPosition.value;
        const density = fileInfo.watermarkDensity !== undefined ? fileInfo.watermarkDensity : watermarkDensity.value;
        
        // 计算水印大小（这里我们需要创建一个临时canvas来计算预览到原始图像的比例）
        // 由于文件可能还没有被预览过，我们需要计算一个合理的缩放比例
        const tempPreviewCanvas = document.createElement('canvas');
        const maxPreviewSize = 500; // 与预览函数中的默认最大高度一致
        let scaleX = 1, scaleY = 1;
        
        if (originalWidth > maxPreviewSize || originalHeight > maxPreviewSize) {
            const widthRatio = maxPreviewSize / originalWidth;
            const heightRatio = maxPreviewSize / originalHeight;
            const scaleRatio = Math.min(widthRatio, heightRatio);
            scaleX = scaleRatio;
            scaleY = scaleRatio;
        }
        
        // 修复宽大于高时水印大小不一致的问题
        // 为每个文件单独计算正确的缩放比例，不依赖当前预览画布
        let previewWidth, previewHeight;
        
        // 计算预览尺寸，保持原始宽高比
        if (originalWidth > originalHeight) {
            // 宽大于高的情况
            if (originalWidth > maxPreviewSize) {
                previewWidth = maxPreviewSize;
                previewHeight = Math.round((originalHeight / originalWidth) * maxPreviewSize);
            } else {
                previewWidth = originalWidth;
                previewHeight = originalHeight;
            }
        } else {
            // 高大于宽或相等的情况
            if (originalHeight > maxPreviewSize) {
                previewHeight = maxPreviewSize;
                previewWidth = Math.round((originalWidth / originalHeight) * maxPreviewSize);
            } else {
                previewWidth = originalWidth;
                previewHeight = originalHeight;
            }
        }
        
        // 计算正确的缩放比例，确保预览和下载的水印大小和位置完全一致
        // 特别针对宽大于高二倍的情况进行优化
        
        // 计算预览缩放比例
        const previewScale = calculatePreviewScale(originalWidth, originalHeight);
        
        // 保留actualScale用于计算边距
        const actualScale = previewScale;
        
        // 使用与预览函数相同的calculateWatermarkSize函数计算水印大小
        // 并添加与预览函数相同的缩放比例调整逻辑
        const baseSize = parseInt(fileInfo.watermarkSize || watermarkSize.value);
        const originalSize = calculateWatermarkSize(originalWidth, originalHeight, baseSize);
        
        // const n = previewScale >= 1 ? 1 : 1 / (previewScale * 2.6);
        // const finalSize = Math.min(
        //     baseSize * n, // 使用动态计算的缩放比例
        //     Math.max(originalWidth, originalHeight) * 0.22 // 最大不超过原图最大边的22%
        // );
        
        // 使用与预览函数相同的计算逻辑，确保预览和下载的水印大小一致
        // calculateWatermarkSize函数已经处理了宽高比的调整
        let finalSize = originalSize;
        
        // 确保水印大小在合理范围内
        finalSize = Math.min(finalSize, Math.max(originalWidth, originalHeight) * 0.22); // 最大不超过原图最大边的22%
        finalSize = Math.max(finalSize, 12); // 确保水印不小于12px
        
        // 保存临时Canvas状态
        tempCtx.save();
        
        // 设置水印透明度
        tempCtx.globalAlpha = opacity;
        
        // 根据水印类型在原始尺寸的Canvas上应用水印
        if (watermarkType === 'text') {
            
            // 文字水印大小增加到原来的1.5倍
            const textWatermarkSize = finalSize * 1.5;
            
            // 设置水印样式
            tempCtx.fillStyle = color;
            tempCtx.font = `${textWatermarkSize}px Arial`;
            tempCtx.textAlign = 'center';
            tempCtx.textBaseline = 'middle';
            
            // 计算水印文本的宽度
            const textWidth = tempCtx.measureText(text).width;
            
            // 计算与预览完全一致的边距
            // 先计算原始图像在预览中的边距（与applyWatermarkToImage函数逻辑相同）
            const previewCanvasWidth = Math.round(originalWidth * previewScale);
            const previewCanvasHeight = Math.round(originalHeight * previewScale);
            const previewSafeMargin = Math.min(20, Math.max(previewCanvasWidth, previewCanvasHeight) * 0.05);
            
            // 然后将预览边距转换为原始图像的边距
            const safeMargin = Math.round(previewSafeMargin / previewScale);
            
            // 根据位置在原始尺寸的Canvas上应用水印
            switch(position) {
                case 'manual':
                    // 使用归一化坐标计算原始图片上的水印位置
                    let mappedX, mappedY;
                    
                    if (fileInfo.hasCustomPosition) {
                        if (fileInfo.normalizedWatermarkX !== undefined && fileInfo.normalizedWatermarkY !== undefined) {
                            // 优先使用归一化坐标（相对位置）
                            mappedX = fileInfo.normalizedWatermarkX * originalWidth;
                            mappedY = fileInfo.normalizedWatermarkY * originalHeight;
                        } else if (fileInfo.watermarkX !== undefined && fileInfo.watermarkY !== undefined) {
                            // 兼容旧的绝对坐标方式
                            const actualCanvasWidth = canvas ? canvas.width : previewWidth;
                            const actualCanvasHeight = canvas ? canvas.height : previewHeight;
                            const xScale = originalWidth / actualCanvasWidth;
                            const yScale = originalHeight / actualCanvasHeight;
                            mappedX = fileInfo.watermarkX * xScale;
                            mappedY = fileInfo.watermarkY * yScale;
                        } else {
                            // 默认居中
                            mappedX = originalWidth / 2;
                            mappedY = originalHeight / 2;
                        }
                    } else {
                        // 没有自定义位置，使用当前的全局归一化位置或默认为中心
                        let normalizedX, normalizedY;
                        
                        // 获取当前预览的归一化位置
                        if (canvas) {
                            normalizedX = manualWatermarkX / canvas.width;
                            normalizedY = manualWatermarkY / canvas.height;
                        } else {
                            normalizedX = 0.5;
                            normalizedY = 0.5;
                        }
                        
                        // 应用到原始图片
                        mappedX = normalizedX * originalWidth;
                        mappedY = normalizedY * originalHeight;
                    }
                    
                    // 确保水印位置在原始图片边界内
                    mappedX = Math.max(0, Math.min(originalWidth, mappedX));
                    mappedY = Math.max(0, Math.min(originalHeight, mappedY));
                    
                    tempCtx.fillText(text, mappedX, mappedY);
                    break;
                case 'top-left':
                    tempCtx.textAlign = 'left';
                    tempCtx.textBaseline = 'top';
                    tempCtx.fillText(text, safeMargin, safeMargin);
                    break;
                case 'top-right':
                    tempCtx.textAlign = 'right';
                    tempCtx.textBaseline = 'top';
                    const rightX = Math.min(originalWidth - safeMargin, originalWidth);
                    tempCtx.fillText(text, rightX, safeMargin);
                    break;
                case 'bottom-left':
                    tempCtx.textAlign = 'left';
                    tempCtx.textBaseline = 'bottom';
                    const bottomY = Math.min(originalHeight - safeMargin, originalHeight);
                    tempCtx.fillText(text, safeMargin, bottomY);
                    break;
                case 'bottom-right':
                    tempCtx.textAlign = 'right';
                    tempCtx.textBaseline = 'bottom';
                    const rightX2 = Math.min(originalWidth - safeMargin, originalWidth);
                    const bottomY2 = Math.min(originalHeight - safeMargin, originalHeight);
                    tempCtx.fillText(text, rightX2, bottomY2);
                    break;
                case 'center':
                    tempCtx.fillText(text, originalWidth / 2, originalHeight / 2);
                    break;
                case 'tiled':
                    // 为平铺水印创建一个临时函数，使用原始尺寸
                    applyTiledWatermarkToOriginal(tempCtx, text, color, textWatermarkSize, density, originalWidth, originalHeight);
                    break;
            }
        } else if (watermarkType === 'image' && watermarkImage) {
            // 图片水印
            // 计算与预览完全一致的边距
            // 使用与预览相同的边距计算逻辑，但适配原始尺寸
            const baseMarginFactor = 0.05; // 统一使用5%的边距因子
            const previewSafeMargin = Math.min(20, Math.max(previewWidth, previewHeight) * baseMarginFactor);
            const safeMargin = Math.round(previewSafeMargin * actualScale);
            
            // 计算图片水印大小（适用于所有位置）
            const imageWatermarkSize = finalSize * 1.8;
            
            // 根据位置在原始尺寸的Canvas上应用图片水印
            switch(position) {
                case 'manual':
                    // 使用归一化坐标计算原始图片上的水印位置
                    let mappedXImage, mappedYImage;
                    
                    if (fileInfo.hasCustomPosition) {
                        if (fileInfo.normalizedWatermarkX !== undefined && fileInfo.normalizedWatermarkY !== undefined) {
                            // 优先使用归一化坐标（相对位置）
                            mappedXImage = fileInfo.normalizedWatermarkX * originalWidth;
                            mappedYImage = fileInfo.normalizedWatermarkY * originalHeight;
                        } else if (fileInfo.watermarkX !== undefined && fileInfo.watermarkY !== undefined) {
                            // 兼容旧的绝对坐标方式
                            const actualCanvasWidthImage = canvas ? canvas.width : previewWidth;
                            const actualCanvasHeightImage = canvas ? canvas.height : previewHeight;
                            const xScaleImage = originalWidth / actualCanvasWidthImage;
                            const yScaleImage = originalHeight / actualCanvasHeightImage;
                            mappedXImage = fileInfo.watermarkX * xScaleImage;
                            mappedYImage = fileInfo.watermarkY * yScaleImage;
                        } else {
                            // 默认居中
                            mappedXImage = originalWidth / 2;
                            mappedYImage = originalHeight / 2;
                        }
                    } else {
                        // 没有自定义位置，使用当前的全局归一化位置或默认为中心
                        let normalizedX, normalizedY;
                        
                        // 获取当前预览的归一化位置
                        if (canvas) {
                            normalizedX = manualWatermarkX / canvas.width;
                            normalizedY = manualWatermarkY / canvas.height;
                        } else {
                            normalizedX = 0.5;
                            normalizedY = 0.5;
                        }
                        
                        // 应用到原始图片
                        mappedXImage = normalizedX * originalWidth;
                        mappedYImage = normalizedY * originalHeight;
                    }
                    
                    // 计算水印左上角坐标（与预览中的绘制方式保持一致）
                    let drawX = mappedXImage - imageWatermarkSize / 2;
                    let drawY = mappedYImage - imageWatermarkSize / 2;
                    
                    // 确保水印位置在原始图片边界内
                    drawX = Math.max(0, Math.min(originalWidth - imageWatermarkSize, drawX));
                    drawY = Math.max(0, Math.min(originalHeight - imageWatermarkSize, drawY));
                    
                    tempCtx.drawImage(watermarkImage, drawX, drawY, imageWatermarkSize, imageWatermarkSize);
                    break;
                case 'top-left':
                    tempCtx.drawImage(watermarkImage, safeMargin, safeMargin, imageWatermarkSize, imageWatermarkSize);
                    break;
                case 'top-right':
                    // 确保水印不会超出右侧边界
                    const rightX = Math.min(originalWidth - imageWatermarkSize - safeMargin, originalWidth - imageWatermarkSize);
                    tempCtx.drawImage(watermarkImage, rightX, safeMargin, imageWatermarkSize, imageWatermarkSize);
                    break;
                case 'bottom-left':
                    // 确保水印不会超出底部边界
                    const bottomY = Math.min(originalHeight - imageWatermarkSize - safeMargin, originalHeight - imageWatermarkSize);
                    tempCtx.drawImage(watermarkImage, safeMargin, bottomY, imageWatermarkSize, imageWatermarkSize);
                    break;
                case 'bottom-right':
                    // 确保水印不会超出右侧和底部边界
                    const rightX2 = Math.min(originalWidth - imageWatermarkSize - safeMargin, originalWidth - imageWatermarkSize);
                    const bottomY2 = Math.min(originalHeight - imageWatermarkSize - safeMargin, originalHeight - imageWatermarkSize);
                    tempCtx.drawImage(watermarkImage, rightX2, bottomY2, imageWatermarkSize, imageWatermarkSize);
                    break;
                case 'center':
                    tempCtx.drawImage(watermarkImage, (originalWidth - imageWatermarkSize) / 2, (originalHeight - imageWatermarkSize) / 2, imageWatermarkSize, imageWatermarkSize);
                    break;
                case 'tiled':
                    // 为平铺图片水印使用原始尺寸的函数
                    applyTiledImageWatermarkToOriginal(tempCtx, imageWatermarkSize, density, originalWidth, originalHeight);
                    break;
            }
        }
        
        // 恢复临时Canvas状态
        tempCtx.restore();
        
        // 确定图像格式和扩展名
        let imageFormat, imageQuality, fileExtension;
        
        // 对于PNG和WebP等无损格式，保持原始格式不压缩
        if (fileInfo.format === 'image/png') {
            imageFormat = fileInfo.format;
            fileExtension = 'png';
            
            // 使用toBlob方法处理PNG格式
            tempCanvas.toBlob(function(blob) {
                resolve({
                    blob,
                    fileName: `pengline-${fileInfo.nameWithoutExt}.${fileExtension}`,
                    extension: fileExtension
                });
            }, imageFormat);
        } else if (fileInfo.format === 'image/webp' || fileInfo.format === 'image/svg+xml') {
            imageFormat = fileInfo.format;
            imageQuality = 1.0; // 不压缩
            // 根据格式设置文件扩展名
            if (fileInfo.format === 'image/webp') {
                fileExtension = 'webp';
            } else {
                fileExtension = 'svg';
            }
            
            // 使用toBlob方法
            tempCanvas.toBlob(function(blob) {
                resolve({
                    blob,
                    fileName: `pengline-${fileInfo.nameWithoutExt}.${fileExtension}`,
                    extension: fileExtension
                });
            }, imageFormat, imageQuality);
        } else {
            // 对于其他格式（jpg、jpeg等），使用JPG格式并应用适度压缩
            imageFormat = 'image/jpeg';
            imageQuality = 0.88; // 适度压缩
            fileExtension = 'jpg';
            
            // 使用toBlob方法
            tempCanvas.toBlob(function(blob) {
                resolve({
                    blob,
                    fileName: `pengline-${fileInfo.nameWithoutExt}.${fileExtension}`,
                    extension: fileExtension
                });
            }, imageFormat, imageQuality);
        }
    });
}

// 下载当前选中的图片
async function downloadSelectedImage() {
    if (uploadedFiles.length === 0 || selectedFileIndex < 0) return;
    
    // 保存当前文件的水印位置
    if (canvas) {
        uploadedFiles[selectedFileIndex].watermarkX = manualWatermarkX;
        uploadedFiles[selectedFileIndex].watermarkY = manualWatermarkY;
    }
    
    // 禁用按钮，显示加载状态
    const downloadCurrentImage = document.getElementById('downloadCurrentImage');
    const downloadCurrentText = document.getElementById('downloadCurrentText');
    const downloadCurrentLoading = document.getElementById('downloadCurrentLoading');
    downloadCurrentImage.disabled = true;
    downloadCurrentText.style.display = 'none';
    downloadCurrentLoading.style.display = 'inline';
    
    try {
        const fileInfo = uploadedFiles[selectedFileIndex];
        const result = await applyWatermarkToFile(fileInfo);
        
        // 创建下载链接
        const link = document.createElement('a');
        const url = URL.createObjectURL(result.blob);
        link.href = url;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('下载失败:', error);
    } finally {
        // 恢复按钮状态
        downloadCurrentText.style.display = 'inline';
        downloadCurrentLoading.style.display = 'none';
        downloadCurrentImage.disabled = false;
    }
}

// 批量下载所有图片
async function downloadAllSelectedImages() {
    if (uploadedFiles.length === 0) return;
    
    // 保存当前文件的水印位置和自定义位置标记（归一化坐标）
    if (canvas && selectedFileIndex >= 0 && selectedFileIndex < uploadedFiles.length) {
        // 保存归一化坐标
        uploadedFiles[selectedFileIndex].normalizedWatermarkX = manualWatermarkX / canvas.width;
        uploadedFiles[selectedFileIndex].normalizedWatermarkY = manualWatermarkY / canvas.height;
        // 保留原始坐标用于兼容性
        uploadedFiles[selectedFileIndex].watermarkX = manualWatermarkX;
        uploadedFiles[selectedFileIndex].watermarkY = manualWatermarkY;
    }
    
    // 如果只有一个文件，直接使用当前下载函数
    if (uploadedFiles.length === 1) {
        return downloadSelectedImage();
    }
    
    // 禁用按钮，显示加载状态
    const downloadAllImages = document.getElementById('downloadAllImages');
    const downloadAllText = document.getElementById('downloadAllText');
    const downloadAllLoading = document.getElementById('downloadAllLoading');
    downloadAllImages.disabled = true;
    downloadAllText.style.display = 'none';
    downloadAllLoading.style.display = 'inline';
    
    try {
        // 多个文件时，使用JSZip打包下载
        const zip = new JSZip();
        
        // 为每个文件应用水印并添加到zip，确保每个文件使用自己的自定义水印位置（归一化坐标）
        const promises = uploadedFiles.map(fileInfo => {
            // 确保每个文件都有完整的水印位置信息，包括归一化坐标
            const fileWithWatermarkInfo = {
                ...fileInfo,
                // 保留原始文件的所有水印相关属性
                normalizedWatermarkX: fileInfo.normalizedWatermarkX,
                normalizedWatermarkY: fileInfo.normalizedWatermarkY,
                watermarkX: fileInfo.watermarkX,
                watermarkY: fileInfo.watermarkY,
                hasCustomPosition: fileInfo.hasCustomPosition || false
            };
            return applyWatermarkToFile(fileWithWatermarkInfo);
        });
        const results = await Promise.all(promises);
        
        // 将所有处理后的文件添加到zip
        results.forEach(result => {
            zip.file(result.fileName, result.blob);
        });
        
        // 生成zip并下载
        zip.generateAsync({type: 'blob'}).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            // link.download = `pengline-watermarked-images-${Date.now()}.zip`;
            link.download = `pengline-watermarked-images.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        });
    } catch (error) {
        console.error('批量下载失败:', error);
    } finally {
        // 恢复按钮状态
        downloadAllText.style.display = 'inline';
        downloadAllLoading.style.display = 'none';
        downloadAllImages.disabled = false;
    }
}

// 旧函数保留但重定向到新函数
async function downloadWatermarkedImage() {
    // 如果有选中的文件，下载当前文件；否则尝试下载所有文件
    if (selectedFileIndex >= 0 && selectedFileIndex < uploadedFiles.length) {
        downloadSelectedImage();
    } else if (uploadedFiles.length > 0) {
        downloadAllSelectedImages();
    }
}

// 初始化应用
function initApp() {
    initEventListeners();
    
    // 初始化显示或隐藏平铺稀疏度控件
    const watermarkDensityContainer = document.getElementById('watermarkDensityContainer');
    if (watermarkDensityContainer) {
        if (watermarkPosition.value === 'tiled') {
            watermarkDensityContainer.style.display = 'flex';
        } else {
            watermarkDensityContainer.style.display = 'none';
        }
    }
}

// 当页面加载完成后初始化应用
window.addEventListener('load', initApp);