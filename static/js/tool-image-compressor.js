document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalInfo = document.getElementById('originalInfo');
    const compressedInfo = document.getElementById('compressedInfo');
    const qualityRange = document.getElementById('qualityRange');
    const qualityValue = document.getElementById('qualityValue');

    const compressBtn = document.getElementById('compressBtn');
    const downloadArea = document.getElementById('downloadArea');
    const downloadLink = document.getElementById('downloadLink');
    const compressionStats = document.querySelector('.compression-stats');
    
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
    
    // 监听文件选择
    fileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            originalFile = e.target.files[0];
            
            // 检查是否为图片文件
            if (!originalFile.type.match('image.*')) {
                fileInfo.textContent = '请选择有效的图片文件';
                fileInfo.style.color = 'red';
                compressBtn.disabled = true;
                return;
            }
            
            // 显示文件信息
            const fileSize = (originalFile.size / 1024).toFixed(2);
            fileInfo.textContent = `${originalFile.name} (${fileSize} KB)`;
            fileInfo.style.color = '#666';
            
            // 读取图片文件并显示预览
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    originalImage = img;
                    // 显示原图预览
                    originalPreview.innerHTML = '';
                    originalPreview.appendChild(img.cloneNode());
                    originalInfo.textContent = `${img.width} × ${img.height} px · ${fileSize} KB`;
 /*                   
                    // 根据图片原始尺寸自动设置合适的最大宽度和高度
                    // 逻辑：如果图片宽高大于2000px，设置为原始尺寸的80%
                    // 如果图片宽高在1000-2000px之间，设置为原始尺寸的90%
                    // 如果图片宽高小于1000px，保持原始尺寸不变
                    let autoMaxWidth, autoMaxHeight;
                    
                    // 设置最大宽度
                    if (img.width > 2000) {
                        autoMaxWidth = Math.round(img.width * 0.8);
                    } else if (img.width > 1000) {
                        autoMaxWidth = Math.round(img.width * 0.9);
                    } else {
                        autoMaxWidth = img.width;
                    }
                    maxWidth.value = autoMaxWidth;
                    
                    // 设置最大高度
                    if (img.height > 2000) {
                        autoMaxHeight = Math.round(img.height * 0.8);
                    } else if (img.height > 1000) {
                        autoMaxHeight = Math.round(img.height * 0.9);
                    } else {
                        autoMaxHeight = img.height;
                    }
                    maxHeight.value = autoMaxHeight;
                    
                    // 设置最小宽度和高度（默认为100px，可以根据需要调整）
                    minWidth.value = Math.min(100, Math.floor(img.width * 0.5));
                    minHeight.value = Math.min(100, Math.floor(img.height * 0.5));
                    
                    // 设置最大宽度和高度的上限为原图尺寸
                    clampInput(maxWidth, 100, img.width);
                    clampInput(maxHeight, 100, img.height);
*/                    
                    // 启用压缩按钮
                    compressBtn.disabled = false;
                    
                    // 清空之前的压缩结果
                    compressedPreview.innerHTML = '';
                    compressedInfo.textContent = '';
                    downloadArea.style.display = 'none';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(originalFile);
        }
    });
    
    // 更新质量显示
    qualityRange.addEventListener('input', function() {
        qualityValue.textContent = this.value;
    });
    
    // 添加输入验证函数
    function validateInputs() {
        let isValid = true;
        const maxW = parseInt(maxWidth.value);
        const maxH = parseInt(maxHeight.value);
        const minW = parseInt(minWidth.value);
        const minH = parseInt(minHeight.value);
        
        // 验证最大宽度
        if (isNaN(maxW) || maxW < 100) {
            maxWidthError.textContent = '最大宽度必须大于等于100';
            maxWidth.classList.add('error');
            isValid = false;
        } else if (originalImage && maxW > originalImage.width) {
            maxWidthError.textContent = `最大宽度不能超过原图宽度(${originalImage.width}px)`;
            maxWidth.classList.add('error');
            isValid = false;
        } else {
            maxWidthError.textContent = '';
            maxWidth.classList.remove('error');
        }
        
        // 验证最大高度
        if (isNaN(maxH) || maxH < 100) {
            maxHeightError.textContent = '最大高度必须大于等于100';
            maxHeight.classList.add('error');
            isValid = false;
        } else if (originalImage && maxH > originalImage.height) {
            maxHeightError.textContent = `最大高度不能超过原图高度(${originalImage.height}px)`;
            maxHeight.classList.add('error');
            isValid = false;
        } else {
            maxHeightError.textContent = '';
            maxHeight.classList.remove('error');
        }
        
        // 验证最小宽度
        if (isNaN(minW) || minW < 100) {
            minWidthError.textContent = '最小宽度必须大于等于100';
            minWidth.classList.add('error');
            isValid = false;
        } else {
            minWidthError.textContent = '';
            minWidth.classList.remove('error');
        }
        
        // 验证最小高度
        if (isNaN(minH) || minH < 100) {
            minHeightError.textContent = '最小高度必须大于等于100';
            minHeight.classList.add('error');
            isValid = false;
        } else {
            minHeightError.textContent = '';
            minHeight.classList.remove('error');
        }
        
        // 验证最大宽高与最小宽高的关系
        if (isValid && maxW < minW) {
            maxWidthError.textContent = '最大宽度不能小于最小宽度';
            minWidthError.textContent = '最小宽度不能大于最大宽度';
            maxWidth.classList.add('error');
            minWidth.classList.add('error');
            isValid = false;
        }
        
        if (isValid && maxH < minH) {
            maxHeightError.textContent = '最大高度不能小于最小高度';
            minHeightError.textContent = '最小高度不能大于最大高度';
            maxHeight.classList.add('error');
            minHeight.classList.add('error');
            isValid = false;
        }
        
        return isValid;
    }
    
    // 添加自动限制输入值的功能
    function clampInput(element, min, max) {
        element.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (isNaN(value)) value = min;
            if (value < min) value = min;
            if (max && value > max) value = max;
            this.value = value;
            validateInputs();
        });
        
        // 处理手动输入的情况
        element.addEventListener('blur', function() {
            let value = parseInt(this.value);
            if (isNaN(value)) value = min;
            if (value < min) value = min;
            if (max && value > max) value = max;
            this.value = value;
            validateInputs();
        });
    }
/*    
    // 为输入框添加验证事件和自动限制功能
    clampInput(maxWidth, 100);
    clampInput(maxHeight, 100);
    clampInput(minWidth, 100);
    clampInput(minHeight, 100);
    
*/
    
    // 压缩图片
    compressBtn.addEventListener('click', function() {
        if (!originalImage || !originalFile) return;
        
        // 先进行输入验证
        // if (!validateInputs()) {
            // return;
        // }
        
        // 显示加载状态
        compressedPreview.innerHTML = '<div class="loading"></div>';
        
        // 获取压缩设置
        const quality = parseInt(qualityRange.value) / 100;
        
        // 创建canvas元素用于处理图片
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 计算压缩后的尺寸
        let newWidth = originalImage.width;
        let newHeight = originalImage.height;
        const aspectRatio = newHeight / newWidth;
/*        
        const maxWidthValue = parseInt(maxWidth.value);
        const maxHeightValue = parseInt(maxHeight.value);
        const minWidthValue = parseInt(minWidth.value);
        const minHeightValue = parseInt(minHeight.value);

        // 应用最大宽度限制
        if (newWidth > maxWidthValue) {
            newWidth = maxWidthValue;
            newHeight = Math.round(newWidth * aspectRatio);
        }
        
        // 应用最大高度限制（在应用最大宽度后检查）
        if (newHeight > maxHeightValue) {
            newHeight = maxHeightValue;
            newWidth = Math.round(newHeight / aspectRatio);
        }
        
        // 应用最小宽度限制
        if (newWidth < minWidthValue) {
            newWidth = minWidthValue;
            newHeight = Math.round(newWidth * aspectRatio);
        }
        
        // 应用最小高度限制（在应用最小宽度后检查）
        if (newHeight < minHeightValue) {
            newHeight = minHeightValue;
            newWidth = Math.round(newHeight / aspectRatio);
        }
*/        
        // 设置canvas尺寸
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 在canvas上绘制图片
        ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);
        
        // 将canvas内容转换为Blob
        canvas.toBlob(function(blob) {
            // 显示压缩后的图片预览
            const compressedImg = new Image();
            compressedImg.onload = function() {
                compressedPreview.innerHTML = '';
                compressedPreview.appendChild(compressedImg);
                
                // 计算压缩后的文件大小
                const compressedSize = (blob.size / 1024).toFixed(2);
                compressedInfo.textContent = `${newWidth} × ${newHeight} px · ${compressedSize} KB`;
                
                // 计算压缩率
                const originalSize = originalFile.size / 1024;
                const reduction = ((1 - (blob.size / 1024) / originalSize) * 100).toFixed(1);
                compressionStats.textContent = `压缩率: ${reduction}% (从 ${originalSize.toFixed(2)} KB 减少到 ${compressedSize} KB)`;
                
                // 创建下载链接
                const url = URL.createObjectURL(blob);
                downloadLink.href = url;
                
                // 设置下载文件名
                const originalName = originalFile.name;
                const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
                const ext = originalName.substring(originalName.lastIndexOf('.')) || '.jpg';
                downloadLink.download = `hengline-${nameWithoutExt}${ext}`;
                
                // 显示下载区域
                downloadArea.style.display = 'block';
                
                // 清理URL对象以释放内存
                downloadLink.addEventListener('click', function cleanup() {
                    setTimeout(function() {
                        URL.revokeObjectURL(url);
                        downloadLink.removeEventListener('click', cleanup);
                    }, 100);
                });
            };
            compressedImg.src = URL.createObjectURL(blob);
        }, originalFile.type || 'image/jpeg', quality);
    });
});