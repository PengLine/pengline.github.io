document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileList = document.getElementById('fileList');
    const selectedFiles = document.getElementById('selectedFiles');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalInfo = document.getElementById('originalInfo');
    const compressedInfo = document.getElementById('compressedInfo');
    const qualityRange = document.getElementById('qualityRange');
    const qualityValue = document.getElementById('qualityValue');
    const compressionAlgorithm = document.getElementById('compressionAlgorithm');

    const compressBtn = document.getElementById('compressBtn');
    const batchCompressBtn = document.getElementById('batchCompressBtn');
    const downloadArea = document.getElementById('downloadArea');
    const mainDownloadLink = document.getElementById('mainDownloadLink');
    const compressionStats = document.querySelector('.compression-stats');
    const imageViewer = document.getElementById('imageViewer');
    const viewerImage = document.getElementById('viewerImage');
    const closeBtn = document.querySelector('.close-btn');
    
    // 错误信息元素
/* 
	const maxWidth = document.getElementById('maxWidth');
    const maxHeight = document.getElementById('maxHeight');
    const minWidth = document.getElementById('minWidth');
    const minHeight = document.getElementById('minHeight');
    const maxWidthError = document.getElementById('maxWidthError');
    const maxHeightError = document.getElementById('maxHeightError');
    const minWidthError = document.getElementById('minWidthError');
    const minHeightError = document.getElementById('minHeightError');
 	*/   
    // 变量初始化
    let originalImage = null;
    let originalFile = null;
    let allFiles = [];
    let currentFileIndex = 0;
    // 严格控制下载按钮状态的标志
    let hasPerformedBatchCompression = false;
    let hasPerformedSingleCompression = false;
    
    // 监听文件选择
    fileInput.addEventListener('change', function(e) {
        // 获取上传按钮元素并置灰
        const uploadBtn = document.querySelector('.upload-btn');
        uploadBtn.style.pointerEvents = 'none';
        uploadBtn.style.opacity = '0.5';
        

        // 显示上传中的提示
        uploadBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>图像加载中...';
        
        if (e.target.files && e.target.files.length > 0) {
            // 过滤出有效的图片文件（排除SVG）
            allFiles = Array.from(e.target.files).filter(file => file.type.match('image.*') && !file.type.match('image/svg+xml'));
            
            if (allFiles.length === 0) {
                fileInfo.textContent = '请选择有效的图片文件';
                fileInfo.style.color = 'red';
                compressBtn.disabled = true;
                batchCompressBtn.disabled = true;
                fileList.style.display = 'none';
                
                // 文件处理完成（但未通过验证），恢复上传按钮状态
                const uploadBtn = document.querySelector('.upload-btn');
                uploadBtn.style.pointerEvents = 'auto';
                uploadBtn.style.opacity = '1';
                uploadBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>点击上传图片 (支持多选，最多40张)';
                
                return;
            } else if (allFiles.length > 40) {
                fileInfo.textContent = '单次选择图片数量不能超过40张';
                fileInfo.style.color = 'red';
                compressBtn.disabled = true;
                batchCompressBtn.disabled = true;
                fileList.style.display = 'none';
                
                // 文件处理完成（但未通过验证），恢复上传按钮状态
                const uploadBtn = document.querySelector('.upload-btn');
                uploadBtn.style.pointerEvents = 'auto';
                uploadBtn.style.opacity = '1';
                
                return;
            }
            
            // 重置压缩状态（新选择文件时）
        resetCompressionState();
        
        // 确保下载按钮被禁用
        mainDownloadLink.disabled = true;
            
            // 显示文件信息
            if (allFiles.length === 1) {
                const fileSize = (allFiles[0].size / 1024).toFixed(2);
                fileInfo.textContent = `${allFiles[0].name} (${fileSize} KB)`;
            } else {
                fileInfo.textContent = `已选择 ${allFiles.length} 张图片`;
            }
            fileInfo.style.color = '#666';
            
            // 显示文件列表
            selectedFiles.innerHTML = '';
            allFiles.forEach((file, index) => {
                const li = document.createElement('li');
                const fileSize = (file.size / 1024).toFixed(2);
                li.textContent = `${file.name} (${fileSize} KB)`;
                // 添加点击切换功能
                li.addEventListener('click', function() {
                    currentFileIndex = index;
                    loadAndDisplayImage(allFiles[index]);
                    // 高亮当前选中的文件
                    Array.from(selectedFiles.children).forEach(child => child.classList.remove('active'));
                    li.classList.add('active');
                });
                selectedFiles.appendChild(li);
            });
            fileList.style.display = 'block';
            
            // 加载第一张图片
            currentFileIndex = 0;
            loadAndDisplayImage(allFiles[0]);
            selectedFiles.children[0].classList.add('active');
            
            // 启用压缩按钮
            compressBtn.disabled = false;
            batchCompressBtn.disabled = false;
            
            // 文件处理完成，恢复上传按钮状态
            const uploadBtn = document.querySelector('.upload-btn');
            uploadBtn.style.pointerEvents = 'auto';
            uploadBtn.style.opacity = '1';
            uploadBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>点击上传图片 (支持多选，最多40张)';
        }
    });
    
    // 重置压缩状态的函数
function resetCompressionState() {
    // 重置压缩标志
    hasPerformedSingleCompression = false;
    hasPerformedBatchCompression = false;
    // 禁用下载按钮
    mainDownloadLink.disabled = true;
    mainDownloadLink.textContent = '下载压缩图片';
    // 隐藏下载区域
    downloadArea.style.display = 'none';
}
    
    // 加载并显示图片的函数
    function loadAndDisplayImage(file) {
        originalFile = file;
        
        // 显示文件信息
        const fileSize = (file.size / 1024).toFixed(2);
        fileInfo.textContent = `${file.name} (${fileSize} KB)`;
        
        // 重置压缩状态（切换图片时）
        resetCompressionState();
        
        // 读取图片文件并显示预览
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                originalImage = img;
                // 显示原图预览
                originalPreview.innerHTML = '';
                originalPreview.appendChild(img.cloneNode());
                // 提取原图扩展名
                const originalExt = originalFile.name.lastIndexOf('.') !== -1 ? originalFile.name.substring(originalFile.name.lastIndexOf('.')).toLowerCase() : '';
                originalInfo.textContent = `${img.width} × ${img.height} px · ${fileSize} KB (${originalExt})`;
                
                // 清空之前的压缩结果
                compressedPreview.innerHTML = '';
                compressedInfo.textContent = '';
                
                // 文件处理完成，恢复上传按钮状态
                const uploadBtn = document.querySelector('.upload-btn');
                uploadBtn.style.pointerEvents = 'auto';
                uploadBtn.style.opacity = '1';
                uploadBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>点击上传图片 (支持多选，最多40张)';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // 打开图片查看器
    function openImageViewer(src) {
        viewerImage.src = src;
        imageViewer.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
    
    // 关闭图片查看器
    function closeImageViewer() {
        imageViewer.style.display = 'none';
        document.body.style.overflow = 'auto'; // 恢复背景滚动
    }
    
    // 为原图预览区域添加单击事件委托
    originalPreview.addEventListener('click', function(event) {
        if (event.target.tagName === 'IMG') {
            openImageViewer(event.target.src);
        }
    });
    
    // 为压缩后预览区域添加单击事件委托
    compressedPreview.addEventListener('click', function(event) {
        if (event.target.tagName === 'IMG') {
            openImageViewer(event.target.src);
        }
    });
    
    // 关闭按钮点击事件
    closeBtn.addEventListener('click', closeImageViewer);
    
    // 点击查看器内任意位置关闭查看器
    imageViewer.addEventListener('click', function() {
        closeImageViewer();
    });
    
    // ESC键关闭查看器
     document.addEventListener('keydown', function(event) {
         if (event.key === 'Escape' && imageViewer.style.display === 'flex') {
             closeImageViewer();
         }
     });
    
    // 更新质量显示
    qualityRange.addEventListener('input', function() {
        qualityValue.textContent = this.value;
    });
    
    // 质量滑块事件监听已在上方实现
    
    // 压缩单个图片的函数
    function compressImage(file, img, quality, algorithm) {
        return new Promise((resolve) => {
            // 创建canvas元素用于处理图片
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 计算压缩后的尺寸
            let newWidth = img.width;
            let newHeight = img.height;
            const aspectRatio = newHeight / newWidth;
            
            // 检查是否为PNG图片
            const isPNG = file.type === 'image/png';
            
            // 根据选择的算法调整压缩参数
            let targetQuality = quality;
            let targetFormat = file.type || 'image/jpeg';
            let applyResize = false;
            let resizeFactor = 1;
            
            switch(algorithm) {
                case 'lossless':
                    // 无损压缩 - 优化PNG处理
                    if (isPNG) {
                        // 对于PNG，使用高质量参数
                        targetQuality = Math.max(0.9, quality);
                        targetFormat = 'image/png';
                        console.log(`PNG无损压缩：使用质量参数 ${targetQuality.toFixed(2)}`);
                    } else {
                        targetQuality = 1; // 非PNG保持完全无损
                        targetFormat = file.type || 'image/png';
                    }
                    applyResize = false;
                    break;
                case 'aggressive':
                    // 激进压缩，适用于需要极小文件大小的场景
                    targetQuality = quality * 0.8; // 降低质量以获得更好的压缩效果
                    // 强力压缩使用JPG格式以提高压缩率
                    targetFormat = 'image/jpeg';
                    
                    // 对于大图片，可以适当缩小尺寸
                    if (img.width > 2000 || img.height > 1500) {
                        applyResize = true;
                        resizeFactor = 0.7; // 大图片缩小到70%
                    } else if (img.width > 1000 || img.height > 800) {
                        applyResize = true;
                        resizeFactor = 0.8; // 中等图片缩小到80%
                    } else if (img.width > 600 || img.height > 600) {
                        applyResize = true;
                        resizeFactor = 0.9; // 小图片缩小到90%
                    }
                    break;
                case 'webp':
                    // 使用WebP格式压缩，通常能获得更小的文件大小
                    targetQuality = quality; // 使用用户选择的质量参数
                    targetFormat = 'image/webp';
                    break;
                case 'default':
                default:
                    // 默认压缩算法 - 优化PNG处理
                    if (isPNG) {
                        // 对于PNG，使用用户质量参数
                        targetQuality = quality;
                        targetFormat = 'image/png';
                        console.log(`PNG默认压缩：使用质量参数 ${targetQuality.toFixed(2)}`);
                    } else {
                        targetQuality = quality * 0.9; // 非PNG稍微降低质量
                        targetFormat = file.type || 'image/jpeg';
                    }
                    break;
            }
            
            // 应用尺寸调整（如果需要）
            if (applyResize) {
                newWidth = Math.round(newWidth * resizeFactor);
                newHeight = Math.round(newHeight * resizeFactor);
            }
            
            // 设置canvas尺寸
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            // 在canvas上绘制图片
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            
            // 简化的降低色深函数 - 高性能版本
            function reduceColorDepth(canvas, maxColors) {
                // 只使用简单的颜色量化，不再进行复杂的颜色统计和调色板构建
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // 根据质量设置量化步长，质量越低步长越大
                const qualityFactor = maxColors / 128;
                const quantStep = Math.max(8, Math.round(32 * (1 - qualityFactor))); // 8-32之间的步长
                
                // 直接对每个像素进行简单的颜色量化
                for (let i = 0; i < data.length; i += 4) {
                    const a = data[i + 3];
                    
                    // 跳过透明像素
                    if (a < 128) continue;
                    
                    // 简单的颜色量化，将RGB值四舍五入到最近的量化步长
                    data[i] = Math.round(data[i] / quantStep) * quantStep;
                    data[i + 1] = Math.round(data[i + 1] / quantStep) * quantStep;
                    data[i + 2] = Math.round(data[i + 2] / quantStep) * quantStep;
                }
                
                // 将处理后的数据绘制回canvas
                ctx.putImageData(imageData, 0, 0);
                
                return canvas;
            }
            
            // 移除了复杂的预处理和过滤策略函数，使用更简单的处理方式
            
            // 专门为PNG图片优化的压缩处理函数
            // 极度简化的PNG压缩函数 - 专注性能
            function optimizePNGCompression() {
                const originalSize = file.size;
                
                // 根据算法选择不同的处理方式
                if (algorithm === 'lossless') {
                    // 无损压缩：只进行基本的降采样，保持图像质量
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // 只对超大图像进行降采样
                    const pixelCount = width * height;
                    if (pixelCount > 2000000) { // 超过200万像素才降采样
                        const scale = Math.sqrt(2000000 / pixelCount);
                        width = Math.round(width * scale);
                        height = Math.round(height * scale);
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(function(blob) {
                        if (blob.size < originalSize) {
                            resolve({ blob: blob, width: width, height: height });
                        } else {
                            // 返回原图
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                const imgBlob = new Blob([e.target.result], { type: file.type });
                                resolve({ blob: imgBlob, width: img.width, height: img.height });
                            };
                            reader.readAsArrayBuffer(file);
                        }
                    }, 'image/png', 1.0);
                } else if (algorithm === 'default') {
                    // 默认压缩：简单高效的处理流程
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // 根据质量和尺寸决定是否降采样
                    const pixelCount = width * height;
                    if (pixelCount > 1000000 || quality < 0.7) { // 超过100万像素或质量较低时降采样
                        const scale = Math.sqrt(Math.min(1000000 / pixelCount, 1.0));
                        width = Math.round(width * scale);
                        height = Math.round(height * scale);
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = quality > 0.8 ? 'medium' : 'low'; // 低质量时使用更快的平滑
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // 只在质量较低时使用简化的色深降低
                    if (quality < 0.9) {
                        // 使用质量直接控制颜色数量，避免复杂计算
                        const maxColors = Math.max(32, Math.round(128 * quality));
                        reduceColorDepth(canvas, maxColors);
                    }
                    
                    // 直接压缩，使用质量参数控制压缩率
                    canvas.toBlob(function(blob) {
                        if (blob.size < originalSize) {
                            resolve({ blob: blob, width: width, height: height });
                        } else {
                            // 返回原图
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                const imgBlob = new Blob([e.target.result], { type: file.type });
                                resolve({ blob: imgBlob, width: img.width, height: img.height });
                            };
                            reader.readAsArrayBuffer(file);
                        }
                    }, 'image/png', Math.min(quality * 0.95, 1.0));
                }
            }
            
            // 只有默认压缩算法的PNG图片使用专门的优化逻辑
            if (isPNG && algorithm === 'default') {
                optimizePNGCompression();
            } else {
                // 非PNG图片的处理逻辑保持不变
                canvas.toBlob(function(blob) {
                    // 对于其他图片格式，如果压缩后变大且尺寸较大，尝试缩小
                    if (blob.size > file.size && (img.width > 800 || img.height > 800)) {
                        console.log('压缩后变大，尝试适度缩小尺寸...');
                        const resizeCanvas = document.createElement('canvas');
                        const resizeFactor = 0.9;
                        resizeCanvas.width = Math.round(newWidth * resizeFactor);
                        resizeCanvas.height = Math.round(newHeight * resizeFactor);
                        const resizeCtx = resizeCanvas.getContext('2d');
                        
                        // 启用高质量图像平滑处理
                        resizeCtx.imageSmoothingEnabled = true;
                        resizeCtx.imageSmoothingQuality = 'high';
                        resizeCtx.drawImage(img, 0, 0, resizeCanvas.width, resizeCanvas.height);
                        
                        resizeCanvas.toBlob(function(resizeBlob) {
                            if (resizeBlob.size < blob.size && resizeBlob.size < file.size) {
                                resolve({ blob: resizeBlob, width: resizeCanvas.width, height: resizeCanvas.height });
                            } else if (blob.size < file.size) {
                                resolve({ blob: blob, width: newWidth, height: newHeight });
                            } else {
                                // 所有尝试都失败，返回原图
                                const reader = new FileReader();
                                reader.onload = function(e) {
                                    const imgBlob = new Blob([e.target.result], { type: file.type });
                                    resolve({ blob: imgBlob, width: img.width, height: img.height });
                                };
                                reader.readAsArrayBuffer(file);
                            }
                        }, file.type, quality * 0.8);
                        return;
                    }
                    
                    // 其他情况，返回压缩结果
                    if (blob.size < file.size) {
                        resolve({ blob: blob, width: newWidth, height: newHeight });
                    } else {
                        // 如果压缩后文件变大，返回原图
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const imgBlob = new Blob([e.target.result], { type: file.type });
                            resolve({ blob: imgBlob, width: img.width, height: img.height });
                        };
                        reader.readAsArrayBuffer(file);
                    }
                }, targetFormat, targetQuality);
            }
        });
    }
    
    // 压缩当前图片
    compressBtn.addEventListener('click', async function() {
        if (!originalImage || !originalFile) return;
        
        // 防止频繁点击 - 置灰按钮并显示提示
        compressBtn.disabled = true;
        compressBtn.textContent = '正在压缩...';
        
        // 显示加载状态
        compressedPreview.innerHTML = '<div class="loading"></div>';
        
        // 获取压缩设置
        const quality = parseInt(qualityRange.value) / 100;
        const algorithm = compressionAlgorithm.value;
        
        try {
            // 调用压缩函数
            const result = await compressImage(originalFile, originalImage, quality, algorithm);
            const { blob, width, height } = result;
            
            // 压缩逻辑直接在下面实现
            
            // 设置下载文件名（保持原文件名）
            const originalName = originalFile.name;
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            let ext = originalName.substring(originalName.lastIndexOf('.')) || '.jpg';
            
            // 根据算法和压缩结果设置扩展名，确保与批量压缩行为一致
            if (algorithm === 'webp') {
                ext = '.webp';
            } else if (algorithm === 'aggressive') {
                // 强力压缩统一使用JPG格式以提高压缩率
                ext = '.jpg';
            } else if (algorithm === 'lossless') {
                // 无损压缩保持原始扩展名
                // 使用原始文件的扩展名，不做修改
            } else {
                // 默认压缩算法，根据实际blob类型设置扩展名（保持原始格式）
                if (blob.type === 'image/jpeg') {
                    ext = '.jpg';
                } else if (blob.type === 'image/png') {
                    ext = '.png';
                } else if (blob.type === 'image/webp') {
                    ext = '.webp';
                }
            }
            
            // 显示压缩后的图片预览
            const compressedImg = new Image();
            compressedImg.onload = function() {
                compressedPreview.innerHTML = '';
                compressedPreview.appendChild(compressedImg);
                
                // 计算压缩后的文件大小
                const compressedSize = (blob.size / 1024).toFixed(2);
                compressedInfo.textContent = `${width} × ${height} px · ${compressedSize} KB (${ext})`;
                
                // 计算压缩率
            const originalSize = originalFile.size / 1024;
            const reduction = ((1 - (blob.size / 1024) / originalSize) * 100).toFixed(1);
            
            // 根据压缩率设置不同颜色
            const compressedSizeKb = (blob.size / 1024).toFixed(2);
            if (reduction < 0) {
                compressionStats.innerHTML = `压缩完成，压缩率： <span style="color: red; font-weight: bold;">${reduction}%</span> (从 ${originalSize.toFixed(2)} KB 增加到 ${compressedSizeKb} KB)`;
            } else {
                compressionStats.innerHTML = `压缩完成，压缩率： <span style="color: green; font-weight: bold;">${reduction}%</span> (从 ${originalSize.toFixed(2)} KB 减少到 ${compressedSizeKb} KB)`;
            }
                
                // 创建下载链接
                const url = URL.createObjectURL(blob);
                mainDownloadLink.href = url;
                
                mainDownloadLink.download = `${nameWithoutExt}${ext}`;
                
                // 设置单个压缩标志
                hasPerformedSingleCompression = true;
                // 重置批量压缩标志
                hasPerformedBatchCompression = false;
                // 更新按钮文本
                mainDownloadLink.textContent = '下载压缩图片';
                // 启用下载按钮
                mainDownloadLink.disabled = false;
                // 显示下载区域
                downloadArea.style.display = 'block';
                
                // 清理URL对象以释放内存
                mainDownloadLink.addEventListener('click', function cleanup() {
                    setTimeout(function() {
                        URL.revokeObjectURL(url);
                        mainDownloadLink.removeEventListener('click', cleanup);
                    }, 100);
                });
            };
            compressedImg.src = URL.createObjectURL(blob);
            
            // 恢复按钮状态
            compressBtn.disabled = false;
            compressBtn.textContent = '压缩当前图片';
        } catch (error) {
            console.error('压缩过程中出错:', error);
            compressedPreview.innerHTML = '<div class="error">压缩失败，请重试</div>';
            
            // 恢复按钮状态
            compressBtn.disabled = false;
            compressBtn.textContent = '压缩当前图片';
        }
    });
    
    // 阻止下载按钮在禁用状态下的点击行为
    mainDownloadLink.addEventListener('click', function(event) {
        if (mainDownloadLink.disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        
        // 检查是否已执行相应的压缩操作
        if (!hasPerformedSingleCompression && !hasPerformedBatchCompression) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        
        // 防止频繁点击 - 置灰按钮并显示提示
        mainDownloadLink.disabled = true;
        mainDownloadLink.textContent = '正在下载...';
        
        // 恢复按钮状态（下载完成后）
        setTimeout(function() {
            mainDownloadLink.disabled = false;
            mainDownloadLink.textContent = hasPerformedBatchCompression ? '下载所有压缩图片 (ZIP)' : '下载压缩图片';
        }, 2000);
    });

    // 批量压缩所有图片
    batchCompressBtn.addEventListener('click', async function() {
        if (allFiles.length === 0) return;
        
        // 防止频繁点击 - 置灰按钮并显示提示
        batchCompressBtn.disabled = true;
        batchCompressBtn.textContent = '正在批量压缩...';
        
        // 显示加载状态
        compressedPreview.innerHTML = '<div class="loading">正在批量压缩...</div>';
        
        // 获取压缩设置
        const quality = parseInt(qualityRange.value) / 100;
        const algorithm = compressionAlgorithm.value;
        
        try {
            // 创建JSZip实例
            const zip = new JSZip();
            
            // 存储压缩结果信息
            let totalOriginalSize = 0;
            let totalCompressedSize = 0;
            let compressionCount = 0;
            
            // 依次压缩每张图片
            const compressedResults = [];
            
            for (let i = 0; i < allFiles.length; i++) {
                const file = allFiles[i];
                totalOriginalSize += file.size;
                
                // 显示当前处理进度
                compressedPreview.innerHTML = `<div class="loading">正在批量压缩 ${i+1}/${allFiles.length}...</div>`;
                
                // 读取图片
                const img = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const img = new Image();
                        img.onload = function() {
                            resolve(img);
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                });
                
                // 压缩图片
                const result = await compressImage(file, img, quality, algorithm);
                const { blob, width, height } = result;
                
                // 更新统计信息
                totalCompressedSize += blob.size;
                compressionCount++;
                
                // 设置文件名（保持原文件名）
                const originalName = file.name;
                const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
                let ext = originalName.substring(originalName.lastIndexOf('.')) || '.jpg';
                
                // 根据算法和压缩结果设置扩展名，确保批量压缩与单个压缩行为一致
                if (algorithm === 'webp') {
                    ext = '.webp';
                } else if (algorithm === 'aggressive') {
                    // 强力压缩统一使用JPG格式以提高压缩率
                    ext = '.jpg';
                } else if (algorithm === 'lossless') {
                    // 无损压缩保持原始扩展名
                    // 使用原始文件的扩展名，不做修改
                } else {
                    // 默认压缩算法，根据实际blob类型设置扩展名（保持原始格式）
                    if (blob.type === 'image/jpeg') {
                        ext = '.jpg';
                    } else if (blob.type === 'image/png') {
                        ext = '.png';
                    } else if (blob.type === 'image/webp') {
                        ext = '.webp';
                    }
                }
                
                const compressedFileName = `${nameWithoutExt}${ext}`;
                
                // 添加到ZIP文件
                zip.file(compressedFileName, blob);
                
                // 保存结果信息
                compressedResults.push({
                    fileName: compressedFileName,
                    originalSize: file.size,
                    compressedSize: blob.size,
                    width: width,
                    height: height
                });
            }
            
            // 生成ZIP文件
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            // 显示当前选中图片的压缩结果预览（如果有压缩结果）
            if (compressedResults.length > 0) {
                // 获取当前选中的图片
                const currentFile = allFiles[currentFileIndex];
                const currentResult = compressedResults[currentFileIndex];
                
                // 读取并显示当前选中的压缩图片
                const currentImg = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const img = new Image();
                        img.onload = function() {
                            // 压缩当前选中的图片用于预览
                            compressImage(currentFile, img, quality, algorithm).then(result => {
                                const { blob, width, height } = result;
                                const previewImg = new Image();
                                previewImg.onload = function() {
                                    compressedPreview.innerHTML = '';
                                    compressedPreview.appendChild(previewImg);
                                    
                                    // 显示压缩后的图片信息
                                    const compressedSize = (blob.size / 1024).toFixed(2);
                                    let ext = currentFile.name.substring(currentFile.name.lastIndexOf('.')) || '.jpg';
                                    
                                    // 根据算法设置扩展名
                                    if (algorithm === 'webp') {
                                        ext = '.webp';
                                    } else if (algorithm === 'aggressive') {
                                        ext = '.jpg';
                                    } else if (algorithm === 'lossless') {
                                        // 保持原始扩展名
                                    } else {
                                        // 默认压缩，根据blob类型设置
                                        if (blob.type === 'image/jpeg') {
                                            ext = '.jpg';
                                        } else if (blob.type === 'image/png') {
                                            ext = '.png';
                                        } else if (blob.type === 'image/webp') {
                                            ext = '.webp';
                                        }
                                    }
                                    
                                    compressedInfo.textContent = `${width} × ${height} px · ${compressedSize} KB (${ext})`;
                                    resolve(previewImg);
                                };
                                previewImg.src = URL.createObjectURL(blob);
                            });
                        };
                        img.src = reader.result;
                    };
                    reader.readAsDataURL(currentFile);
                });
            }
            
            // 计算总压缩率
            const totalOriginalSizeKB = totalOriginalSize / 1024;
            const totalCompressedSizeKB = totalCompressedSize / 1024;
            const totalReduction = ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(1);
            
            // 更新统计信息显示，根据压缩率设置不同颜色
            if (totalReduction < 0) {
                compressionStats.innerHTML = `批量压缩完成，共压缩 ${compressionCount} 张图片，总压缩率： <span style="color: red; font-weight: bold;">${totalReduction}%</span> (从 ${totalOriginalSizeKB.toFixed(2)} KB 增加到 ${totalCompressedSizeKB.toFixed(2)} KB)`;
            } else {
                compressionStats.innerHTML = `批量压缩完成，共压缩 ${compressionCount} 张图片，总压缩率：<span style="color: green; font-weight: bold;">${totalReduction}%</span> (从 ${totalOriginalSizeKB.toFixed(2)} KB 减少到 ${totalCompressedSizeKB.toFixed(2)} KB)`;
            }
            
            // 创建下载链接
            const url = URL.createObjectURL(zipBlob);
            mainDownloadLink.href = url;
            // mainDownloadLink.download = `hengline-compressed-${new Date().toISOString().slice(0, 10)}.zip`;
            mainDownloadLink.download = `hengline-compressed-images.zip`;
            
            // 设置批量压缩标志 - 这是唯一能启用批量下载按钮的途径
                hasPerformedBatchCompression = true;
                // 重置单个压缩标志
                hasPerformedSingleCompression = false;
                // 更新按钮文本
                mainDownloadLink.textContent = '下载所有压缩图片 (ZIP)';
                // 启用下载按钮
                mainDownloadLink.disabled = false;
                // 显示下载区域
                downloadArea.style.display = 'block';
                
                // 清理URL对象以释放内存
                mainDownloadLink.addEventListener('click', function cleanup() {
                    setTimeout(function() {
                        URL.revokeObjectURL(url);
                        mainDownloadLink.removeEventListener('click', cleanup);
                    }, 100);
                });
            
            // 如果是单张图片，也更新预览
            if (allFiles.length === 1) {
                // 更新预览为第一张图片的压缩结果
                const firstResult = compressedResults[0];
                const firstZipFile = await zip.file(firstResult.fileName).async('blob');
                
                const compressedImg = new Image();
                compressedImg.onload = function() {
                    compressedPreview.innerHTML = '';
                    compressedPreview.appendChild(compressedImg);
                    
                    const compressedSize = (firstResult.compressedSize / 1024).toFixed(2);
                    compressedInfo.textContent = `${firstResult.width} × ${firstResult.height} px · ${compressedSize} KB`;
                    
                    const originalSize = firstResult.originalSize / 1024;
                    const reduction = ((1 - firstResult.compressedSize / firstResult.originalSize) * 100).toFixed(1);
                    
                    // 根据压缩率设置不同颜色
                     const compressedSizeKb = (firstResult.compressedSize / 1024).toFixed(2);
                     if (reduction < 0) {
                         compressionStats.innerHTML = `压缩完成，压缩率： <span style="color: red; font-weight: bold;">${reduction}%</span> (从 ${originalSize.toFixed(2)} KB 增加到 ${compressedSizeKb} KB)`;
                     } else {
                         compressionStats.innerHTML = `压缩完成，压缩率： <span style="color: green; font-weight: bold;">${reduction}%</span> (从 ${originalSize.toFixed(2)} KB 减少到 ${compressedSizeKb} KB)`;
                     }
                    
                    mainDownloadLink.href = URL.createObjectURL(firstZipFile);
                    mainDownloadLink.download = firstResult.fileName;
                    // 设置单个压缩标志
                    hasPerformedSingleCompression = true;
                    // 重置批量压缩标志
                    hasPerformedBatchCompression = false;
                    // 更新按钮文本
                    mainDownloadLink.textContent = '下载压缩图片';
                    // 启用下载按钮
                    mainDownloadLink.disabled = false;
                    downloadArea.style.display = 'block';
                    
                    // 清理URL对象以释放内存
                    mainDownloadLink.addEventListener('click', function cleanup() {
                        setTimeout(function() {
                            URL.revokeObjectURL(mainDownloadLink.href);
                            mainDownloadLink.removeEventListener('click', cleanup);
                        }, 100);
                    });
                };
                compressedImg.src = URL.createObjectURL(firstZipFile);
            } else {
                // 多张图片时更新统计信息
                // 根据压缩率设置不同颜色
                if (totalReduction < 0) {
                    compressionStats.innerHTML = `批量压缩完成，共压缩 ${compressionCount} 张图片，总压缩率： <span style="color: red; font-weight: bold;">${totalReduction}%</span> (从 ${totalOriginalSizeKB.toFixed(2)} KB 增加到 ${totalCompressedSizeKB.toFixed(2)} KB)`;
                } else {
                    compressionStats.innerHTML = `批量压缩完成，共压缩 ${compressionCount} 张图片，总压缩率： <span style="color: green; font-weight: bold;">${totalReduction}%</span> (从 ${totalOriginalSizeKB.toFixed(2)} KB 减少到 ${totalCompressedSizeKB.toFixed(2)} KB)`;
                }
            }
            
            // 清理URL对象以释放内存
            mainDownloadLink.addEventListener('click', function cleanup() {
                setTimeout(function() {
                    URL.revokeObjectURL(url);
                    mainDownloadLink.removeEventListener('click', cleanup);
                }, 100);
            });
            
            // 恢复按钮状态
            batchCompressBtn.disabled = false;
            batchCompressBtn.textContent = '批量压缩所有图片';
        } catch (error) {
            console.error('批量压缩过程中出错:', error);
            compressedPreview.innerHTML = '<div class="error">批量压缩失败，请重试</div>';
            
            // 恢复按钮状态
            batchCompressBtn.disabled = false;
            batchCompressBtn.textContent = '批量压缩所有图片';
        }
    });
});