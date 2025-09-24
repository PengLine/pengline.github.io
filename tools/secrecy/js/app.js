/**
 * JavaScript代码保护工具 - 主要功能实现
 */

// DOM元素引用
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const protectBtn = document.getElementById('protectBtn');
const downloadBtn = document.getElementById('downloadBtn');
const previewSection = document.getElementById('previewSection');
const originalCode = document.getElementById('originalCode');
const protectedCode = document.getElementById('protectedCode');
const tabBtns = document.querySelectorAll('.tab-btn');
const minifyCheckbox = document.getElementById('minify');
const obfuscateCheckbox = document.getElementById('obfuscate');
const wasmCheckbox = document.getElementById('wasm');

// 存储处理后的代码
let processedCode = '';
let originalFileName = '';

// 初始化事件监听器
function initEventListeners() {
    // 文件上传事件
    fileInput.addEventListener('change', handleFileUpload);
    
    // 保护按钮点击事件
    protectBtn.addEventListener('click', protectCode);
    
    // 下载按钮点击事件
    downloadBtn.addEventListener('click', downloadFile);
    
    // 选项卡切换事件
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn));
    });
    
    // 拖拽上传支持
    const uploadBox = document.querySelector('.upload-box');
    uploadBox.addEventListener('dragover', handleDragOver);
    uploadBox.addEventListener('dragleave', handleDragLeave);
    uploadBox.addEventListener('drop', handleDrop);
}

// 处理文件上传
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// 拖拽上传事件处理
function handleDragOver(e) {
    e.preventDefault();
    const uploadBox = document.querySelector('.upload-box');
    uploadBox.style.backgroundColor = '#e3f2fd';
}

function handleDragLeave(e) {
    e.preventDefault();
    const uploadBox = document.querySelector('.upload-box');
    uploadBox.style.backgroundColor = '#fafafa';
}

function handleDrop(e) {
    e.preventDefault();
    const uploadBox = document.querySelector('.upload-box');
    uploadBox.style.backgroundColor = '#fafafa';
    
    const file = e.dataTransfer.files[0];
    if (file) {
        fileInput.files = e.dataTransfer.files;
        processFile(file);
    }
}

// 处理上传的文件
function processFile(file) {
    if (file.type !== 'application/javascript' && !file.name.endsWith('.js')) {
        showFileInfo('请上传JavaScript文件 (.js)', 'error');
        return;
    }
    
    originalFileName = file.name;
    showFileInfo(`已上传文件: ${file.name} (${formatFileSize(file.size)})`);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const code = e.target.result;
        originalCode.textContent = code;
        protectBtn.disabled = false;
        previewSection.style.display = 'block';
    };
    reader.readAsText(file);
}

// 显示文件信息
function showFileInfo(message, type = 'success') {
    fileInfo.textContent = message;
    fileInfo.classList.add('show');
    
    // 重置样式
    fileInfo.className = 'file-info show';
    
    // 添加类型样式
    if (type === 'error') {
        fileInfo.classList.add('error');
        fileInfo.style.backgroundColor = '#ffebee';
        fileInfo.style.borderLeftColor = '#f44336';
    } else {
        fileInfo.style.backgroundColor = '#e3f2fd';
        fileInfo.style.borderLeftColor = '#2196f3';
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 保护代码
function protectCode() {
    const code = originalCode.textContent;
    
    // 禁用按钮防止重复点击
    protectBtn.disabled = true;
    protectBtn.textContent = '处理中...';
    
    // 模拟处理延迟
    setTimeout(() => {
        let result = code;
        
        // 代码压缩
        if (minifyCheckbox.checked) {
            result = minifyCode(result);
        }
        
        // 代码混淆
        if (obfuscateCheckbox.checked) {
            result = obfuscateCode(result);
        }
        
        // WASM转换（简化版实现）
        if (wasmCheckbox.checked) {
            result = addWasmWrapper(result);
        }
        
        // 存储处理后的代码
        processedCode = result;
        protectedCode.textContent = result;
        
        // 启用下载按钮
        downloadBtn.disabled = false;
        
        // 切换到保护后代码标签
        switchTab(tabBtns[1]);
        
        // 恢复按钮状态
        protectBtn.textContent = '保护代码';
        protectBtn.disabled = false;
        
        showFileInfo(`代码保护完成！文件大小: ${formatFileSize(new Blob([result]).size)}`);
    }, 500);
}

// 代码压缩函数
function minifyCode(code) {
    // 移除注释
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    code = code.replace(/\/\/.*$/gm, '');
    
    // 移除日志打印语句
    code = code.replace(/console\.(log|debug|info|warn|error|assert|dir|dirxml|trace|group|groupEnd|time|timeEnd|profile|profileEnd|count)\([\s\S]*?\);?/g, '');
    
    // 移除多余空格和换行
    code = code.replace(/\s+/g, ' ');
    code = code.replace(/\s*{\s*/g, '{');
    code = code.replace(/\s*}\s*/g, '}');
    code = code.replace(/\s*;\s*/g, ';');
    code = code.replace(/\s*,\s*/g, ',');
    code = code.replace(/\s*:\s*/g, ':');
    code = code.replace(/\s*=\s*/g, '=');
    code = code.replace(/\s*\+\s*/g, '+');
    code = code.replace(/\s*-\s*/g, '-');
    code = code.replace(/\s*\*\s*/g, '*');
    code = code.replace(/\s*\/\s*/g, '/');
    code = code.replace(/\s*\|\|\s*/g, '||');
    code = code.replace(/\s*&&\s*/g, '&&');
    code = code.replace(/\s*===\s*/g, '===');
    code = code.replace(/\s*!==\s*/g, '!==');
    code = code.replace(/\s*==\s*/g, '==');
    code = code.replace(/\s*!=\s*/g, '!=');
    code = code.replace(/\s*<\s*/g, '<');
    code = code.replace(/\s*>\s*/g, '>');
    code = code.replace(/\s*<=\s*/g, '<=');
    code = code.replace(/\s*>=\s*/g, '>=');
    
    return code;
}

// 代码混淆函数
function obfuscateCode(code) {
    // 简单的变量和函数名混淆
    const varNames = new Set();
    const funcNames = new Set();
    
    // 提取变量名
    let varPattern = /\b(let|var|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    let match;
    while ((match = varPattern.exec(code)) !== null) {
        varNames.add(match[2]);
    }
    
    // 提取函数名
    let funcPattern = /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    while ((match = funcPattern.exec(code)) !== null) {
        funcNames.add(match[1]);
    }
    
    // 创建混淆映射
    const varMap = new Map();
    const funcMap = new Map();
    
    // 为变量生成简短的名称
    let counter = 0;
    varNames.forEach(name => {
        varMap.set(name, generateShortName(counter++));
    });
    
    // 为函数生成简短的名称
    funcNames.forEach(name => {
        funcMap.set(name, generateShortName(counter++));
    });
    
    // 替换代码中的变量名和函数名
    let obfuscatedCode = code;
    
    // 首先替换函数名
    funcMap.forEach((newName, oldName) => {
        // 使用词边界确保只替换完整的函数名
        const regex = new RegExp(`\b${oldName}\b(?!\s*:)`, 'g');
        obfuscatedCode = obfuscatedCode.replace(regex, newName);
    });
    
    // 然后替换变量名
    varMap.forEach((newName, oldName) => {
        // 使用词边界确保只替换完整的变量名
        const regex = new RegExp(`\b${oldName}\b(?!\s*:)`, 'g');
        obfuscatedCode = obfuscatedCode.replace(regex, newName);
    });
    
    return obfuscatedCode;
}

// 生成简短的变量名
function generateShortName(counter) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
    let name = '';
    
    do {
        name = chars[counter % chars.length] + name;
        counter = Math.floor(counter / chars.length);
    } while (counter > 0);
    
    return name;
}

// 添加WASM包装器（简化版实现）
function addWasmWrapper(code) {
    // 由于在纯前端环境中实现完整的JS到WASM转换很复杂
    // 这里我们添加一个简单的包装器，模拟WASM保护
    return `(function() {
    // WebAssembly 包装器 - 保护您的代码
    const encodedCode = '${btoa(unescape(encodeURIComponent(code)))}';
    
    // 模拟WASM解码执行
    function executeProtectedCode() {
        try {
            const decodedCode = decodeURIComponent(escape(atob(encodedCode)));
            // 使用Function构造函数执行代码
            const execute = new Function(decodedCode);
            execute();
        } catch (e) {
            console.error('代码执行错误:', e);
        }
    }
    
    // 延迟执行，增加破解难度
    setTimeout(executeProtectedCode, Math.random() * 100);
})();`;
}

// 切换预览选项卡
function switchTab(activeBtn) {
    // 更新按钮状态
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
    
    // 显示对应的代码块
    const tabId = activeBtn.getAttribute('data-tab');
    originalCode.classList.toggle('hidden', tabId !== 'original');
    protectedCode.classList.toggle('hidden', tabId !== 'protected');
}

// 下载文件
function downloadFile() {
    if (!processedCode) return;
    
    // 创建文件名
    const baseName = originalFileName.replace(/\.js$/, '');
    const protectedFileName = `pengline-${baseName}.js`;
    
    // 创建Blob对象
    const blob = new Blob([processedCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = protectedFileName;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// 初始化应用
function initApp() {
    initEventListeners();
    previewSection.style.display = 'none';
}

// 当页面加载完成后初始化应用
window.addEventListener('DOMContentLoaded', initApp);