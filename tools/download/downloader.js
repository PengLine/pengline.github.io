// 全局变量
let downloadQueue = [];
let activeDownloads = 0;
let maxConcurrency = 3;
let totalFiles = 0;
let completedFiles = 0;
let failedFiles = 0;
let zipFiles = []; // 用于存储需要打包的文件
let shouldPackZip = false; // 是否打包为ZIP

// DOM 元素
const streamUrlsTextarea = document.getElementById('streamUrls');
const concurrencyInput = document.getElementById('concurrency');
const fileTypeSelect = document.getElementById('fileType');
const packDownloadCheckbox = document.getElementById('packDownload');
const startDownloadBtn = document.getElementById('startDownload');
const clearListBtn = document.getElementById('clearList');
const downloadListElement = document.getElementById('downloadList');
const progressBar = document.getElementById('progressBar');
const totalFilesElement = document.getElementById('totalFiles');
const completedFilesElement = document.getElementById('completedFiles');
const failedFilesElement = document.getElementById('failedFiles');

// 初始化事件监听器
function initEventListeners() {
    startDownloadBtn.addEventListener('click', startDownloadProcess);
    clearListBtn.addEventListener('click', clearUrlList);
    concurrencyInput.addEventListener('change', updateMaxConcurrency);
}

// 更新最大并发数
function updateMaxConcurrency() {
    maxConcurrency = parseInt(concurrencyInput.value) || 3;
    // 限制在合理范围内
    if (maxConcurrency < 1) maxConcurrency = 1;
    if (maxConcurrency > 10) maxConcurrency = 10;
    concurrencyInput.value = maxConcurrency;
}

// 清空URL列表
function clearUrlList() {
    streamUrlsTextarea.value = '';
    downloadListElement.innerHTML = '';
    resetCounters();
}

// 重置计数器
function resetCounters() {
    totalFiles = 0;
    completedFiles = 0;
    failedFiles = 0;
    zipFiles = []; // 清空ZIP文件列表
    shouldPackZip = packDownloadCheckbox ? packDownloadCheckbox.checked : false; // 获取打包选项状态
    updateStats();
    progressBar.style.width = '0%';
    
    // 移除之前的完成状态提示
    const statusElement = document.getElementById('completionStatus');
    if (statusElement) {
        statusElement.remove();
    }
}

// 打包文件为ZIP并下载
function packAndDownloadZip() {
    if (zipFiles.length === 0) {
        console.log('没有可打包的文件');
        return;
    }
    
    // 检查是否有JSZip库可用
    if (typeof JSZip === 'undefined') {
        console.error('JSZip库未加载');
        alert('ZIP打包功能需要JSZip库，请确保已加载此库');
        return;
    }
    
    const zip = new JSZip();
    const currentDate = new Date();
    // const timestamp = `${currentDate.getFullYear()}${(currentDate.getMonth()+1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}_${currentDate.getHours().toString().padStart(2, '0')}${currentDate.getMinutes().toString().padStart(2, '0')}`;
    const timestamp = `${currentDate.getFullYear()}${(currentDate.getMonth()+1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}`;
    const zipFileName = `pengline-downloads-${timestamp}.zip`;
    
    // 添加文件到ZIP
    zipFiles.forEach(file => {
        zip.file(file.name, file.blob);
    });
    
    // 生成ZIP并下载
    zip.generateAsync({type: 'blob'})
        .then(content => {
            // 创建下载链接
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = zipFileName;
            // 添加额外的属性来强制下载
            link.target = '_self'; // 确保在当前窗口下载而不是新窗口
            link.rel = 'noopener noreferrer'; // 安全属性
            document.body.appendChild(link);
            
            // 使用更强的触发下载方式
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            link.dispatchEvent(clickEvent);
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }, 100);
            
            console.log('ZIP文件下载完成');
        })
        .catch(error => {
            console.error('ZIP生成失败:', error);
            alert('ZIP文件生成失败，请重试');
        });
}

// 显示完成状态
function showCompletionStatus() {
    // 如果需要打包且有文件，执行打包
    if (shouldPackZip && zipFiles.length > 0) {
        packAndDownloadZip();
    }
    
    // 移除之前的状态提示（如果存在）
    const existingStatus = document.getElementById('completionStatus');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // 创建新的状态提示元素
    const statusDiv = document.createElement('div');
    statusDiv.id = 'completionStatus';
    statusDiv.className = 'completion-status';
    
    // 设置状态内容和样式
    let statusText = '';
    if (shouldPackZip && zipFiles.length > 0) {
        statusText = `打包完成！共 ${completedFiles} 个文件，其中 ${zipFiles.length} 个已打包，${failedFiles} 个失败`;
    } else if (failedFiles === 0) {
        statusText = `全部下载完成！共 ${completedFiles} 个文件`;
    } else {
        statusText = `下载完成，其中：成功 ${completedFiles} 个，失败 ${failedFiles} 个`;
    }
    
    if (failedFiles === 0) {
        statusDiv.innerHTML = `
            <span class="status-icon success">✓</span>
            <span class="status-text">${statusText}</span>
        `;
    } else {
        statusDiv.innerHTML = `
            <span class="status-icon partial">!</span>
            <span class="status-text">${statusText}</span>
        `;
    }
    
    // 添加到下载区域的顶部
    const downloadSection = document.querySelector('.download-section');
    downloadSection.insertBefore(statusDiv, downloadSection.firstChild);
    
    // 5秒后自动淡出状态提示
    setTimeout(() => {
        statusDiv.classList.add('fade-out');
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 500);
    }, 5000);
}

// 更新统计信息
function updateStats() {
    totalFilesElement.textContent = totalFiles;
    completedFilesElement.textContent = completedFiles;
    failedFilesElement.textContent = failedFiles;
    
    // 更新进度条
    if (totalFiles > 0) {
        const progress = ((completedFiles + failedFiles) / totalFiles) * 100;
        progressBar.style.width = `${progress}%`;
    } else {
        progressBar.style.width = '0%';
    }
}

// 格式化URL地址
function formatUrl(url) {
    // 移除http/https之前的所有字符
    const httpIndex = url.toLowerCase().indexOf('http');
    if (httpIndex > 0) {
        url = url.substring(httpIndex);
    }
    
    // 确保URL有协议
    if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) {
        url = 'https://' + url;
    }
    
    // 移除URL末尾的斜杠和空白字符
    url = url.trim().replace(/\/$/, '');
    
    return url;
}

// 验证URL格式
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// 显示错误提示
function showError(message) {
    // 移除之前的错误提示（如果存在）
    const existingError = document.getElementById('errorMessage');
    if (existingError) {
        existingError.remove();
    }
    
    // 创建错误提示元素
    const errorDiv = document.createElement('div');
    errorDiv.id = 'errorMessage';
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <span class="error-icon">!</span>
        <span class="error-text">${message}</span>
    `;
    
    // 添加到输入区域下方
    const inputSection = document.querySelector('.input-section');
    inputSection.appendChild(errorDiv);
    
    // 5秒后自动淡出错误提示
    setTimeout(() => {
        errorDiv.classList.add('fade-out');
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 500);
    }, 5000);
}

// 开始下载过程
function startDownloadProcess() {
    // 移除之前的错误提示
    const existingError = document.getElementById('errorMessage');
    if (existingError) {
        existingError.remove();
    }
    
    // 清空之前的下载列表
    downloadListElement.innerHTML = '';
    resetCounters();
    
    // 获取并处理URL列表
    const urlsText = streamUrlsTextarea.value.trim();
    if (!urlsText) {
        showError('请输入流地址！');
        return;
    }
    
    // 分割URL、格式化并过滤空行
    const urls = urlsText.split('\n')
        .map(url => url.trim())
        .filter(url => url)
        .map(formatUrl) // 格式化URL
        .filter(isValidUrl); // 过滤无效URL
    
    if (urls.length === 0) {
        showError('没有有效的流地址！请检查输入格式。');
        return;
    }
    
    // 根据文件类型筛选
    const filteredUrls = filterUrlsByType(urls, fileTypeSelect.value);
    
    if (filteredUrls.length === 0) {
        showError('没有符合条件的文件！请检查文件类型筛选设置。');
        return;
    }
    
    // 初始化下载队列
    downloadQueue = [...filteredUrls];
    totalFiles = downloadQueue.length;
    updateStats();
    
    // 禁用开始按钮
    startDownloadBtn.disabled = true;
    
    // 开始处理队列
    processDownloadQueue();
}

// 根据文件类型筛选URL
function filterUrlsByType(urls, fileType) {
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff)$/i;
    const videoExtensions = /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i;
    
    if (fileType === 'all') {
        return urls;
    } else if (fileType === 'image') {
        return urls.filter(url => imageExtensions.test(url));
    } else if (fileType === 'video') {
        return urls.filter(url => videoExtensions.test(url));
    }
    
    return urls;
}

// 处理下载队列
function processDownloadQueue() {
    // 当队列不为空且活跃下载数小于最大并发数时，继续下载
    while (downloadQueue.length > 0 && activeDownloads < maxConcurrency) {
        const url = downloadQueue.shift();
        downloadFile(url);
    }
    
    // 检查是否所有下载都已完成
    if (activeDownloads === 0) {
        startDownloadBtn.disabled = false;
        if (totalFiles > 0) {
            showCompletionStatus();
        }
    }
}

// 下载单个文件 - 主方法
function downloadFile(url) {
    activeDownloads++;
    
    // 创建下载项元素
    const downloadItem = createDownloadItemElement(url);
    const progressBar = downloadItem.querySelector('.item-progress-bar');
    const statusElement = downloadItem.querySelector('.status');
    
    statusElement.textContent = '准备下载...';
    
    // 直接使用tryDirectDownload作为首选方法，它包含了多种下载策略
    // 这样可以优先尝试直接下载，然后依次尝试其他方法
    new Promise((resolve, reject) => {
        tryDirectDownload(url, downloadItem, progressBar, statusElement, resolve, reject);
    })
    .catch(error => {
        console.error('下载失败:', error);
        updateDownloadStatus(downloadItem, statusElement, 'failed', '下载失败');
        failedFiles++;
    })
    .finally(() => {
        // 无论成功还是失败，都更新统计信息并处理队列
        activeDownloads--;
        updateStats();
        processDownloadQueue(); // 处理队列中的下一个下载
    });
}

// 使用fetch API下载，带重试机制
function fetchWithRetry(url, downloadItem, progressBar, statusElement, retries = 2) {
    return new Promise((resolve, reject) => {
        // 首先尝试使用cors模式，这允许我们访问响应内容
        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'image/*, video/*, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            credentials: 'omit',
            mode: 'cors',  // 首先尝试cors模式
            cache: 'default'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                
                // 模拟进度更新
                progressBar.style.width = '50%';
                
                // 现在我们可以正确访问响应内容
                return response.blob()
                    .then(blob => {
                        // 检查blob是否为空
                        if (blob.size === 0) {
                            throw new Error('获取的blob为空');
                        }
                        
                        const fileName = getFileNameFromUrl(url);
                        
                        if (shouldPackZip) {
                            // 成功获取blob，可以添加到ZIP
                            zipFiles.push({name: fileName, blob: blob});
                            
                            // 更新进度和状态
                            progressBar.style.width = '100%';
                            updateDownloadStatus(downloadItem, statusElement, 'completed', '已添加到ZIP', url, blob, fileName);
                            completedFiles++;
                            resolve();
                        } else {
                            // 直接下载模式
                            const blobUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = blobUrl;
                            a.download = fileName;
                            // 添加额外的属性来强制下载
                            a.target = '_self'; // 确保在当前窗口下载而不是新窗口
                            a.rel = 'noopener noreferrer'; // 安全属性
                            a.style.display = 'none';
                            document.body.appendChild(a);
                            
                            // 使用更强的触发下载方式
                            const clickEvent = new MouseEvent('click', {
                                view: window,
                                bubbles: true,
                                cancelable: true
                            });
                            a.dispatchEvent(clickEvent);
                            
                            // 清理
                            setTimeout(() => {
                                document.body.removeChild(a);
                                URL.revokeObjectURL(blobUrl);
                                
                                // 更新进度和状态
                                progressBar.style.width = '100%';
                                updateDownloadStatus(downloadItem, statusElement, 'completed', '已完成', url, blob, fileName);
                                completedFiles++;
                                resolve();
                            }, 1000);
                        }
                    });
            })
            .catch(error => {
                console.warn('CORS模式失败，尝试no-cors模式:', error);
                // 如果cors模式失败，使用no-cors模式和备用下载方法
                return fallbackDownloadMethod(url, downloadItem, progressBar, statusElement)
                    .then(() => resolve())
                    .catch(fallbackError => {
                        console.error(`下载失败 (剩余重试次数: ${retries}):`, fallbackError);
                        if (retries > 0) {
                            // 等待一段时间后重试
                            setTimeout(() => {
                                fetchWithRetry(url, downloadItem, progressBar, statusElement, retries - 1)
                                    .then(resolve)
                                    .catch(reject);
                            }, 1000 * (3 - retries)); // 指数退避策略
                        } else {
                            reject(fallbackError);
                        }
                    });
            });
    });
}

// 备用下载方法 - 使用fetch和blob强制下载
function fallbackDownloadMethod(url, downloadItem, progressBar, statusElement) {
    return new Promise((resolve, reject) => {
        // 更新状态为使用备用方法
        statusElement.textContent = '使用备用方法...';
        
        try {
            // 使用no-cors模式避免CORS限制
            fetch(url, {
                method: 'GET',
                mode: 'no-cors', // 使用no-cors模式
                credentials: 'omit'
            })
            .then(response => {
                // 注意：在no-cors模式下，我们无法访问响应的实际内容或状态
                // 这种情况下获取的blob可能是空的或不完整的
                return response.blob();
            })
            .then(blob => {
                // 对于no-cors模式获取的blob，我们无法确定其内容是否有效
                // 但我们可以检查大小
                const fileName = getFileNameFromUrl(url);
                
                if (shouldPackZip) {
                    // 对于ZIP打包，我们需要说明这是通过no-cors模式获取的
                    // 因为blob可能是空的
                    if (blob.size === 0) {
                        // 创建一个说明文件
                        const textBlob = new Blob([`无法通过no-cors模式获取此文件内容，URL: ${url}`], {type: 'text/plain'});
                        zipFiles.push({name: fileName + '.txt', blob: textBlob});
                        
                        // 同时尝试直接下载原始文件，但使用更强的下载属性
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        // 添加额外的属性来强制下载
                        a.target = '_self'; // 确保在当前窗口下载而不是新窗口
                        a.rel = 'noopener noreferrer'; // 安全属性
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        
                        // 使用更强的触发下载方式
                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        a.dispatchEvent(clickEvent);
                        
                        setTimeout(() => {
                            document.body.removeChild(a);
                            progressBar.style.width = '100%';
                            updateDownloadStatus(downloadItem, statusElement, 'completed', '已添加说明文件并单独下载', url);
                            completedFiles++;
                            resolve();
                        }, 1000);
                    } else {
                        // 即使blob不为空，在no-cors模式下我们也不能确定其内容
                        // 添加警告说明并尝试使用blob
                        zipFiles.push({name: fileName, blob: blob});
                        
                        progressBar.style.width = '100%';
                        updateDownloadStatus(downloadItem, statusElement, 'completed', '已添加到ZIP(可能不完整)', url, blob, fileName);
                        completedFiles++;
                        resolve();
                    }
                } else {
                    // 直接下载模式，检查blob是否为空
                    if (blob.size === 0) {
                        // 如果blob为空，直接使用原始URL下载
                        console.warn('blob为空，使用原始URL下载');
                        tryDirectDownload(url, downloadItem, progressBar, statusElement, resolve, reject);
                    } else {
                        // 使用blob来强制下载，避免浏览器直接打开文件
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = fileName;
                        // 添加额外的属性来强制下载
                        a.target = '_self'; // 确保在当前窗口下载而不是新窗口
                        a.rel = 'noopener noreferrer'; // 安全属性
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        
                        // 使用更强的触发下载方式
                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        a.dispatchEvent(clickEvent);
                        
                        // 清理
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(blobUrl);
                            
                            // 更新进度和状态
                            progressBar.style.width = '100%';
                            updateDownloadStatus(downloadItem, statusElement, 'completed', '已完成', url, blob, fileName);
                            completedFiles++;
                            resolve();
                        }, 1000);
                    }
                }
            })
            .catch(fetchError => {
                console.warn('Fetch blob失败，尝试直接链接下载:', fetchError);
                // 如果blob方法失败，回退到直接链接下载
                tryDirectDownload(url, downloadItem, progressBar, statusElement, resolve, reject);
            });
        } catch (error) {
            console.error('下载方法初始化失败:', error);
            reject(error);
        }
    });
}

// 直接链接下载的备用方法
// 实现多种下载策略，确保能下载到正确格式的文件
function tryDirectDownload(url, downloadItem, progressBar, statusElement, resolve, reject) {
    const fileName = getFileNameFromUrl(url);
    
    // 优先使用简单的Fetch + Blob下载方式（用户推荐的方法）
    downloadWithSimpleFetch(url, fileName, downloadItem, progressBar, statusElement, resolve, reject);
    
    // 策略1：使用a标签直接下载（确保下载正确格式文件）
    function downloadWithATag() {
        statusElement.textContent = '直接下载文件...';
        console.log('尝试策略1: A标签直接下载');
        
        try {
            const a = document.createElement('a');
            
            // 确保URL已格式化
            const formattedUrl = formatUrl(url);
            a.href = formattedUrl;
            
            // 对于图片文件，确保文件名包含正确的扩展名
            // 直接从URL中提取真实的文件名（包含扩展名）
            const urlObj = new URL(formattedUrl);
            const pathname = urlObj.pathname;
            const realFileName = pathname.substring(pathname.lastIndexOf('/') + 1);
            
            // 解码文件名中的特殊字符
            const decodedFileName = decodeURIComponent(realFileName);
            a.download = decodedFileName; // 使用URL中的真实文件名，包含完整扩展名
            
            // 对于图片下载，使用_self而不是_blank，避免新标签页打开图片
            a.target = '_self';
            // 设置download属性为空字符串，强制触发下载对话框
            a.download = '';
            // 添加安全属性
            a.rel = 'noopener noreferrer';
            a.style.display = 'none';
            document.body.appendChild(a);
            
            // 使用更强大的触发下载方式
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                composed: true, // 允许事件穿过Shadow DOM边界
                detail: 1 // 点击次数
            });
            
            // 强制触发点击
            a.dispatchEvent(clickEvent);
            
            // 对于图片文件，给足够的时间完成下载
            setTimeout(() => {
                // 移除元素
                document.body.removeChild(a);
                
                // 立即继续下一个策略，不假设下载成功
                progressBar.style.width = '40%';
                downloadWithBlobFallback();
            }, 2000); // 增加时间，确保下载完成
        } catch (error) {
            console.error('A标签下载失败，尝试下一种方式:', error);
            downloadWithBlobFallback();
        }
    }
    
    // 策略2：使用Fetch + Blob方式下载
    function downloadWithBlobFallback() {
        statusElement.textContent = '使用Blob方式下载...';
        console.log('尝试策略2: Fetch + Blob下载');
        
        try {
            // 确保URL已格式化
            const formattedUrl = formatUrl(url);
            
            // 对于图片文件，添加特定的请求头以确保获取原始数据
            fetch(formattedUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'image/*', // 对于图片文件，明确指定接受图片类型
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': url.split('/').slice(0, 3).join('/') + '/' // 添加Referer头以避免某些网站的防盗链
                },
                credentials: 'omit',
                mode: 'cors',
                redirect: 'follow' // 允许重定向
            })
            .then(response => {
                // 检查响应状态
                if (!response.ok) {
                    console.warn(`响应状态码: ${response.status}，尝试no-cors模式`);
                    return fetchWithNoCors();
                }
                
                progressBar.style.width = '60%';
                
                // 获取Content-Type和文件名信息
                const contentType = response.headers.get('content-type');
                const contentDisposition = response.headers.get('content-disposition');
                
                // 从URL中提取真实的文件名和扩展名
                const urlObj = new URL(formattedUrl);
                const pathname = urlObj.pathname;
                let finalFileName = pathname.substring(pathname.lastIndexOf('/') + 1);
                
                // 解码文件名
                finalFileName = decodeURIComponent(finalFileName);
                
                // 如果有Content-Disposition头，尝试从中提取文件名
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                    if (filenameMatch && filenameMatch[1]) {
                        finalFileName = filenameMatch[1];
                    }
                }
                
                return response.blob().then(blob => ({
                    blob,
                    contentType,
                    finalFileName
                }));
            })
            .then(({blob, contentType, finalFileName}) => {
                progressBar.style.width = '80%';
                
                if (!blob || blob.size === 0) {
                    console.error('Blob为空，尝试流方式');
                    return downloadWithStream();
                }
                
                // 确保blob有正确的MIME类型
                if (contentType && blob.type !== contentType) {
                    console.log(`调整Blob MIME类型从 ${blob.type} 到 ${contentType}`);
                    // 创建一个新的Blob对象，使用正确的MIME类型
                    const newBlob = new Blob([blob], {type: contentType});
                    // 确保使用正确的文件名和MIME类型
                    downloadBlob(newBlob, finalFileName, downloadItem, statusElement, progressBar, url);
                } else {
                    // 直接使用获取的blob和文件名
                    downloadBlob(blob, finalFileName, downloadItem, statusElement, progressBar, url);
                }
                resolve();
            })
            .catch(error => {
                console.error('CORS模式Fetch失败:', error);
                fetchWithNoCors();
            });
        } catch (error) {
            console.error('Fetch初始化失败:', error);
            downloadWithStream();
        }
    }
    
    // 使用no-cors模式的fetch
    function fetchWithNoCors() {
        try {
            // 确保URL已格式化
            const formattedUrl = formatUrl(url);
            
            fetch(formattedUrl, {
                method: 'GET',
                mode: 'no-cors',
                credentials: 'omit'
            })
            .then(response => {
                progressBar.style.width = '70%';
                return response.blob();
            })
            .then(blob => {
                if (!blob || blob.size === 0) {
                    console.error('No-CORS Blob为空，尝试流方式');
                    return downloadWithStream();
                }
                
                downloadBlob(blob, fileName, downloadItem, statusElement, progressBar, url);
                resolve();
            })
            .catch(error => {
                console.error('No-CORS Fetch失败:', error);
                downloadWithStream();
            });
        } catch (error) {
            console.error('No-CORS初始化失败:', error);
            downloadWithStream();
        }
    }
    
    // 策略3：使用基于流的下载方式
    function downloadWithStream() {
        statusElement.textContent = '使用流方式下载...';
        console.log('尝试策略3: 基于流的下载');
        
        try {
            // 确保URL已格式化
            const formattedUrl = formatUrl(url);
            
            // 对于图片文件，使用特定的请求头
            fetch(formattedUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'image/*', // 明确指定接受图片类型
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': url.split('/').slice(0, 3).join('/') + '/' // 添加Referer头以避免某些网站的防盗链
                },
                credentials: 'omit',
                mode: 'cors',
                redirect: 'follow' // 允许重定向
            })
            .then(response => {
                // 检查是否支持流
                if (!response.body || !response.body.getReader) {
                    console.warn('不支持流，最后尝试复制链接方式');
                    return copyLinkAsLastResort();
                }
                
                progressBar.style.width = '85%';
                
                // 获取流的总大小和内容类型
                const contentLength = response.headers.get('content-length');
                const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
                const contentType = response.headers.get('content-type');
                let downloadedSize = 0;
                
                // 从URL中提取真实的文件名和扩展名
                const urlObj = new URL(formattedUrl);
                const pathname = urlObj.pathname;
                let finalFileName = pathname.substring(pathname.lastIndexOf('/') + 1);
                
                // 解码文件名
                finalFileName = decodeURIComponent(finalFileName);
                
                // 创建一个缓冲区来存储数据
                const chunks = [];
                const reader = response.body.getReader();
                
                // 处理流数据
                function readChunk() {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            // 流读取完成，合并数据块
                            // 确保使用正确的MIME类型
                            const blobOptions = contentType ? { type: contentType } : {};
                            const blob = new Blob(chunks, blobOptions);
                            
                            if (blob.size === 0) {
                                console.error('流数据为空，最后尝试复制链接');
                                return copyLinkAsLastResort();
                            }
                            
                            // 使用下载blob的方式，并确保使用正确的文件名
                            progressBar.style.width = '95%';
                            downloadBlob(blob, finalFileName, downloadItem, statusElement, progressBar, url);
                            resolve();
                            return;
                        }
                        
                        // 添加数据块并更新进度
                        chunks.push(value);
                        downloadedSize += value.length;
                        
                        if (totalSize > 0) {
                            const progress = 85 + (downloadedSize / totalSize) * 10; // 85%到95%
                            progressBar.style.width = Math.min(progress, 95) + '%';
                        }
                        
                        // 继续读取下一个数据块
                        return readChunk();
                    });
                }
                
                // 开始读取流
                return readChunk();
            })
            .catch(error => {
                console.error('流下载失败:', error);
                copyLinkAsLastResort();
            });
        } catch (error) {
            console.error('流下载初始化失败:', error);
            copyLinkAsLastResort();
        }
    }
    
    // 策略4：复制链接方式 - 只作为最后的备用方案
    function copyLinkAsLastResort() {
        statusElement.textContent = '提供下载链接...';
        console.log('尝试策略4: 复制链接方式（最终备用）');
        
        try {
            // 确保URL已格式化
            const formattedUrl = formatUrl(url);
            
            // 创建下载信息blob（仅作为备用说明）
            const downloadInfo = `下载链接: ${formattedUrl}\n\n文件名: ${fileName}\n\n请手动复制链接到浏览器下载原始文件。`;
            const textBlob = new Blob([downloadInfo], {type: 'text/plain;charset=utf-8'});
            
            // 尝试使用Clipboard API复制链接
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(url)
                    .then(() => {
                        console.log('链接已复制到剪贴板');
                        statusElement.textContent = '链接已复制！请粘贴到浏览器下载原始文件';
                    })
                    .catch(() => {});
            }
            
            // 对于ZIP模式，添加说明文件
            if (shouldPackZip) {
                zipFiles.push({name: `${fileName}_download_link.txt`, blob: textBlob});
            }
            
            // 清理并更新状态
            setTimeout(() => {
                progressBar.style.width = '100%';
                updateDownloadStatus(downloadItem, statusElement, 'completed', '请使用链接下载原始文件', url, textBlob, fileName);
                completedFiles++;
                resolve();
            }, 500);
        } catch (error) {
            console.error('复制链接方式失败:', error);
            handleDownloadError('请手动复制链接下载');
        }
    }
    
    // 错误处理函数
    function handleDownloadError(message) {
        statusElement.textContent = message;
        progressBar.style.width = '0%';
        failedFiles++;
        updateStats();
        updateDownloadStatus(downloadItem, statusElement, 'failed', message);
        reject(new Error(message));
    }
    
    // 从策略1开始尝试 - 首先尝试直接下载原始格式文件
    downloadWithATag();
}

// 下载blob文件
function downloadBlob(blob, fileName, downloadItem, statusElement, progressBar, originalUrl = null) {
    try {
        console.log(`下载Blob: 大小=${blob.size}, 类型=${blob.type}, 文件名=${fileName}`);
        
        // 创建一个Blob URL
        const blobUrl = URL.createObjectURL(blob);
        
        // 创建下载链接
        const a = document.createElement('a');
        a.href = blobUrl;
        
        // 确保文件名包含正确的扩展名
        // 从URL中提取真实的扩展名（如果有的话）
        let finalFileName = fileName;
        if (originalUrl) {
            const urlParts = originalUrl.split('.');
            if (urlParts.length > 1) {
                const urlExtension = urlParts[urlParts.length - 1].split('?')[0].toLowerCase();
                // 检查是否是有效的图片扩展名
                const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
                if (imageExtensions.includes(urlExtension)) {
                    // 如果文件名没有扩展名或者扩展名不正确，添加或替换扩展名
                    const fileNameParts = fileName.split('.');
                    if (fileNameParts.length === 1 || !imageExtensions.includes(fileNameParts[fileNameParts.length - 1].toLowerCase())) {
                        finalFileName = fileNameParts[0] + '.' + urlExtension;
                    }
                }
            }
        }
        a.download = finalFileName;
        
        // 使用_self避免新窗口打开
        a.target = '_self';
        // 添加安全属性
        a.rel = 'noopener noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        
        // 使用增强的触发下载方式
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            composed: true, // 允许事件穿过Shadow DOM边界
            detail: 1 // 点击次数
        });
        a.dispatchEvent(clickEvent);
        
        // 对于图片文件，给更长的时间完成下载
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        }, 2000); // 延长时间到2秒，确保图片下载完成
        
        // 更新状态 - 传递blob和fileName以支持查看功能
        updateDownloadStatus(downloadItem, statusElement, 'completed', '已完成', originalUrl, blob, finalFileName);
        progressBar.style.width = '100%';
        completedFiles++;
    } catch (error) {
        console.error('Blob下载失败:', error);
        statusElement.textContent = '下载失败';
        updateDownloadStatus(downloadItem, statusElement, 'failed', '下载失败');
        failedFiles++;
    }
}

// 更新下载状态辅助函数
function updateDownloadStatus(downloadItem, statusElement, statusClass, statusText, fileUrl, blob = null, fileName = null) {
    downloadItem.classList.remove('downloading', 'completed', 'failed');
    downloadItem.classList.add(statusClass);
    
    // 清空状态元素内容
    statusElement.innerHTML = '';
    statusElement.classList.remove('downloading', 'completed', 'failed');
    statusElement.classList.add(statusClass);
    
    // 如果下载完成且有文件URL或blob，添加文本和"查看"按钮
    if (statusClass === 'completed' && (fileUrl || blob)) {
        // 创建文本节点
        const textNode = document.createTextNode(statusText);
        statusElement.appendChild(textNode);
        
        // 添加空格分隔
        statusElement.appendChild(document.createTextNode(' '));
        
        // 创建查看按钮
        const viewButton = document.createElement('button');
        viewButton.textContent = '查看';
        viewButton.className = 'open-file-btn';
        viewButton.title = '点击查看已下载的文件';
        
        // 保存文件信息到按钮，方便后续操作
        if (blob) {
            viewButton.dataset.hasBlob = 'true';
            // 注意：实际使用时会在点击时创建Blob URL
        }
        
        if (fileName) {
            viewButton.dataset.fileName = fileName;
            // 检测文件类型
            const fileExtension = fileName.split('.').pop().toLowerCase();
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
            const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
            
            if (imageExtensions.includes(fileExtension)) {
                viewButton.dataset.fileType = 'image';
            } else if (videoExtensions.includes(fileExtension)) {
                viewButton.dataset.fileType = 'video';
            } else {
                viewButton.dataset.fileType = 'other';
            }
        }
        
        viewButton.onclick = function(event) {
            // 阻止事件冒泡，避免触发其他操作
            event.stopPropagation();
            
            try {
                if (blob) {
                    // 使用blob创建临时URL来查看文件
                    const blobUrl = URL.createObjectURL(blob);
                    
                    // 根据文件类型选择不同的查看方式
                    const fileType = this.dataset.fileType || 'other';
                    
                    if (fileType === 'image' || fileType === 'video') {
                        // 对于图片和视频，在新窗口中查看
                        const viewerWindow = window.open('', '_blank', 'width=800,height=600,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
                        
                        if (viewerWindow) {
                            // 设置页面内容
                            if (fileType === 'image') {
                                viewerWindow.document.write(`
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                        <title>查看图片 - ${this.dataset.fileName || '未知文件'}</title>
                                        <style>
                                            body { margin: 0; padding: 10px; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                                            img { max-width: 100%; max-height: 100vh; box-shadow: 0 0 10px rgba(0,0,0,0.2); }
                                        </style>
                                    </head>
                                    <body>
                                        <img src="${blobUrl}" alt="${this.dataset.fileName || '图片'}">
                                    </body>
                                    </html>
                                `);
                            } else if (fileType === 'video') {
                                viewerWindow.document.write(`
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                        <title>查看视频 - ${this.dataset.fileName || '未知文件'}</title>
                                        <style>
                                            body { margin: 0; padding: 10px; background-color: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                                            video { max-width: 100%; max-height: 100vh; }
                                        </style>
                                    </head>
                                    <body>
                                        <video controls>
                                            <source src="${blobUrl}" type="${blob.type || 'video/mp4'}">
                                            您的浏览器不支持视频播放。
                                        </video>
                                    </body>
                                    </html>
                                `);
                            }
                            
                            // 确保页面加载完成
                            viewerWindow.document.close();
                            
                            // 窗口关闭时清理blob URL
                            viewerWindow.addEventListener('beforeunload', function() {
                                URL.revokeObjectURL(blobUrl);
                            });
                        }
                    } else {
                        // 对于其他类型的文件，尝试在新标签页打开
                        window.open(blobUrl, '_blank');
                        // 设置一个超时来清理blob URL
                        setTimeout(() => {
                            URL.revokeObjectURL(blobUrl);
                        }, 60000); // 1分钟后清理
                    }
                } else if (fileUrl) {
                    // 如果没有blob但有fileUrl，使用fileUrl打开
                    window.open(fileUrl, '_blank');
                }
            } catch (error) {
                console.error('查看文件时出错:', error);
                alert('无法查看文件，请尝试手动打开下载的文件。');
            }
        };
        
        statusElement.appendChild(viewButton);
        statusElement.classList.add('has-open-button');
    } else {
        // 普通状态，只设置文本
        statusElement.textContent = statusText;
    }
}

// 从URL中提取文件名
function getFileNameFromUrl(url) {
    try {
        // 确保URL已格式化
        const formattedUrl = formatUrl(url);
        const urlObj = new URL(formattedUrl);
        const pathname = urlObj.pathname;
        const fileName = pathname.substring(pathname.lastIndexOf('/') + 1);
        
        // 解码文件名，处理URL编码的特殊字符
        const decodedFileName = decodeURIComponent(fileName);
        
        // 对于图片文件，确保有扩展名
        if (decodedFileName && decodedFileName.includes('.')) {
            // 提取扩展名
            const extension = decodedFileName.split('.').pop().toLowerCase();
            // 检查是否是有效的文件扩展名
            const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'mp4', 'avi', 'mov', 'wmv'];
            if (validExtensions.includes(extension)) {
                return decodedFileName;
            }
        }
        
        // 如果文件名不包含扩展名，尝试从URL参数或路径中提取
        if (!decodedFileName || !decodedFileName.includes('.')) {
            // 检查URL查询参数中是否包含文件名信息
            const queryParams = urlObj.searchParams;
            for (const [key, value] of queryParams) {
                if (key.toLowerCase().includes('file') || key.toLowerCase().includes('name') || 
                    value.toLowerCase().includes('.jpg') || value.toLowerCase().includes('.png') || 
                    value.toLowerCase().includes('.mp4')) {
                    const potentialName = decodeURIComponent(value);
                    if (potentialName.includes('.')) {
                        return potentialName.split('/').pop();
                    }
                }
            }
            
            // 从content-type推断扩展名
            // 这里只是简单的文件名生成，实际的扩展名需要在获取响应后确定
            return `file_${Date.now()}`;
        }
        
        return decodedFileName;
    } catch (error) {
        console.error('获取文件名失败:', error);
        // 如果URL解析失败，使用时间戳作为文件名
        return `file_${Date.now()}`;
    }
}

// 根据内容类型添加扩展名
function addExtensionByContentType(fileName, contentType) {
    const extensionMap = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/svg+xml': '.svg',
        'image/bmp': '.bmp',
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'video/avi': '.avi',
        'video/quicktime': '.mov',
        'video/x-flv': '.flv',
        'video/x-matroska': '.mkv'
    };
    
    return fileName + (extensionMap[contentType] || '.bin');
}

// 新增：使用简单的Fetch + Blob方式下载（参照用户提供的方法）
function downloadWithSimpleFetch(url, fileName, downloadItem, progressBar, statusElement, resolve, reject) {
    statusElement.textContent = '使用简单Fetch方式下载...';
    console.log('使用用户推荐的简单Fetch + Blob下载方式');
    
    try {
        // 确保URL已格式化
        const formattedUrl = formatUrl(url);
        
        // 从URL中提取文件名（如果未提供）
        let finalFileName = fileName;
        if (!finalFileName) {
            const urlObj = new URL(formattedUrl);
            const pathname = urlObj.pathname;
            finalFileName = pathname.substring(pathname.lastIndexOf('/') + 1);
            // 解码文件名
            finalFileName = decodeURIComponent(finalFileName);
            
            // 确保文件名不为空
            if (!finalFileName) {
                finalFileName = 'image.jpg';
            }
        }
        
        fetch(formattedUrl)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            progressBar.style.width = '70%';
            return res.blob();
        })
        .then(blob => {
            progressBar.style.width = '90%';
            
            // 创建a标签
            var link = document.createElement('a');
            // 设置a标签为不可见
            link.style.display = 'none';
            // 将a标签添加到body
            document.body.appendChild(link);
            // 生成Blob URL并设置给a标签的href属性
            var blobUrl = window.URL.createObjectURL(blob);
            link.href = blobUrl;
            // 设置a标签的download
            link.download = finalFileName;
            // 模拟点击事件进行下载
            link.click();
            
            // 下载完成后清理
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(link);
                
                progressBar.style.width = '100%';
                statusElement.textContent = '下载成功';
                completedFiles++;
                updateStats();
                resolve();
            }, 500);
        })
        .catch(error => {
            console.error('简单Fetch下载失败:', error);
            statusElement.textContent = '下载失败，尝试其他方式';
            // 尝试原始的下载方式作为备选
            downloadWithATag();
        });
    } catch (error) {
        console.error('下载初始化失败:', error);
        statusElement.textContent = '下载初始化失败';
        handleDownloadError('下载初始化失败');
    }
}

// 错误处理函数
function handleDownloadError(message) {
    statusElement.textContent = message;
    progressBar.style.width = '0%';
    failedFiles++;
    updateStats();
    reject(new Error(message));
}

// 创建下载项元素
function createDownloadItemElement(url) {
    const item = document.createElement('div');
    item.className = 'download-item downloading';
    
    const fileName = getFileNameFromUrl(url);
    
    item.innerHTML = `
        <div class="item-header">
            <span class="file-name">${fileName}</span>
            <span class="status downloading">下载中</span>
        </div>
        <div class="item-progress">
            <div class="item-progress-bar" style="width: 0%"></div>
        </div>
    `;
    
    downloadListElement.appendChild(item);
    return item;
}

// 初始化应用
function initApp() {
    initEventListeners();
    updateMaxConcurrency();
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);