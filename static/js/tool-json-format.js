document.addEventListener('DOMContentLoaded', function () {
    const rawJsonInput = document.getElementById('raw-json');
    const formatButton = document.getElementById('format-btn');
    const clearButton = document.getElementById('clear-btn');
    const copyButton = document.getElementById('copy-btn');
    const copyButtonBottom = document.getElementById('copy-btn-bottom');
    const pasteButton = document.getElementById('paste-btn');
    const minifyButton = document.getElementById('minify-btn');
    const escapeButton = document.getElementById('escape-btn');
    const toggleButton = document.getElementById('collapse-btn'); // 重命名为toggleButton，用于切换折叠/展开
    const errorMessage = document.getElementById('error-message');
    const fullscreenButton = document.getElementById('fullscreen-btn');
    const editorContainerWrapper = document.querySelector('.editor-container-wrapper');
    const editorContainer = document.querySelector('.editor-container');

    // 暴露给全局作用域以便全屏功能使用
    window.editorContainer = editorContainer;
    window.fullscreenButton = fullscreenButton;

    // 底部按钮引用
    const pasteButtonBottom = document.getElementById('paste-btn-bottom');
    const formatButtonBottom = document.getElementById('format-btn-bottom');
    const toggleButtonBottom = document.getElementById('collapse-btn-bottom');
    const minifyButtonBottom = document.getElementById('minify-btn-bottom');
    const escapeButtonBottom = document.getElementById('escape-btn-bottom');
    const clearButtonBottom = document.getElementById('clear-btn-bottom');

    const indentNum = 8;  // 缩进格

    // 页面加载时禁用折叠按钮，但设置文本为'折叠'以与图标的默认展开状态保持一致
    toggleButton.disabled = true;
    toggleButton.classList.add('disabled');
    toggleButton.textContent = '折叠';

    // 初始化底部折叠按钮
    toggleButtonBottom.disabled = true;
    toggleButtonBottom.classList.add('disabled');
    toggleButtonBottom.textContent = '折叠';

    // 定义最大深度，控制JSON格式化时的折叠行为
    const maxDepth = 100;

    // 格式化按钮点击事件
    formatButton.addEventListener('click', function () {
        try {
            // 修复：连续点击格式化报错的问题
            // 检查编辑器是否已经是只读状态（已格式化过）
            let inputText;
            if (rawJsonInput.contentEditable === 'false' && rawJsonInput.dataset.originalJson) {
                // 如果已经格式化过，使用保存的原始JSON数据
                inputText = rawJsonInput.dataset.originalJson;
            } else {
                // 获取当前输入的文本或HTML内容
                if (rawJsonInput.contentEditable === 'false') {
                    // 如果是只读状态但没有保存原始数据，尝试从HTML内容中提取
                    // 这种情况通常是直接填充了格式化后的HTML
                    inputText = extractJsonFromHtml(rawJsonInput.innerHTML);
                } else {
                    // 否则获取当前输入的文本
                    inputText = rawJsonInput.textContent.trim();
                }

                // 检查输入是否为空
                if (!inputText) {
                    throw new Error('请输入JSON内容');
                }
            }

            // 预处理输入，移除可能导致问题的字符
            let preprocessedText = inputText
                // 移除行首和行尾的空白字符
                .trim()
                // 处理UTF-8 BOM
                .replace(/^\uFEFF/, '')
                // 规范化换行符
                .replace(/\r\n/g, '\n');

            const result = isValidJSON(preprocessedText, { allowArrays: false });

            // 验证是否为有效的JSON数据
            if (!result.valid) {
                if (result.line) {
                    throw new Error(`非法的JSON数据：位置: 第 ${result.line} 行第 ${result.column} 列`);
                } else {
                    throw new Error(`非法的JSON数据：${result.error}`);
                }

            }

            // 尝试使用增强的JSON解析方法
            const parsedJson = enhancedParseJson(preprocessedText);

            // 生成高亮的HTML
            const highlightedHtml = highlightJson(parsedJson);

            // 应用高亮的HTML到编辑器
            if (highlightedHtml) {
                // 保存原始JSON文本，供压缩和转义按钮使用
                rawJsonInput.dataset.originalJson = JSON.stringify(parsedJson);

                // 设置编辑器为只读
                rawJsonInput.contentEditable = 'false';

                // 更新编辑器内容
                rawJsonInput.innerHTML = highlightedHtml;

                // 空错误提示
                errorMessage.textContent = '';
                errorMessage.classList.remove('show');

                // 添加-符号到[和{前面
                // setTimeout(() => {
                //     addMinusSigns();
                // }, 0);

                // 格式化成功后启用折叠按钮并显示"折叠"文本
                toggleButton.disabled = false;
                toggleButton.classList.remove('disabled');
                toggleButton.textContent = '折叠';

                // 同时启用底部折叠按钮
                toggleButtonBottom.disabled = false;
                toggleButtonBottom.classList.remove('disabled');
                toggleButtonBottom.textContent = '折叠';

            } else {
                throw new Error('生成高亮HTML失败');
            }
        } catch (error) {
            console.error(error);
            // 显示错误信息
            errorMessage.textContent = `JSON格式化错误， ${error.message}`;
            errorMessage.classList.add('show');
            showNotification('JSON格式化失败');
        }
    });

    // 清空按钮点击事件
    clearButton.addEventListener('click', function () {
        rawJsonInput.textContent = '';
        // 清空保存的原始JSON数据
        delete rawJsonInput.dataset.originalJson;
        // 隐藏错误消息
        errorMessage.classList.remove('show');
        // 移除错误高亮
        const highlightedElements = rawJsonInput.querySelectorAll('.error-highlight');
        highlightedElements.forEach(el => {
            const textNode = document.createTextNode(el.textContent);
            el.parentNode.replaceChild(textNode, el);
        });

        // 清空后让输入框获得焦点并设置光标位置
        setTimeout(() => {
            // 确保输入框可编辑
            rawJsonInput.contentEditable = 'true';
            rawJsonInput.focus();
            // 创建一个Range对象并设置到输入框的开始位置
            const range = document.createRange();
            range.setStart(rawJsonInput, 0);
            range.collapse(true);
            // 创建一个Selection对象并添加Range
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }, 0);

        // 清空后禁用折叠按钮并改为'展开'
        toggleButton.disabled = true;
        toggleButton.classList.add('disabled');
        toggleButton.textContent = '展开';

        // 同时禁用底部折叠按钮
        toggleButtonBottom.disabled = true;
        toggleButtonBottom.classList.add('disabled');
        toggleButtonBottom.textContent = '展开';
    });

    // 处理contenteditable div的粘贴事件，移除HTML格式并处理JSON内容
    rawJsonInput.addEventListener('paste', function (e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');

        try {
            // 尝试解析是否为JSON
            const parsedJson = JSON.parse(text.trim());
            const formattedJson = JSON.stringify(parsedJson, null, 2);

            // 确保输入框是可编辑的
            rawJsonInput.contentEditable = 'true';
            // 清空当前内容
            rawJsonInput.textContent = '';
            // 插入格式化后的JSON
            document.execCommand('insertText', false, formattedJson);
        } catch (e) {
            // 不是JSON，直接插入原始文本
            // 确保输入框是可编辑的
            rawJsonInput.contentEditable = 'true';
            document.execCommand('insertText', false, text);
        }

        // 强制更新行号
        setTimeout(() => {
            updateLineNumbers();
            // 同步滚动
            syncScroll();
        }, 10);

        // 清空保存的原始JSON数据
        delete rawJsonInput.dataset.originalJson;

        // 禁用折叠按钮
        toggleButton.disabled = true;
        toggleButton.classList.add('disabled');
        toggleButton.textContent = '展开';

        // 同时禁用底部折叠按钮
        toggleButtonBottom.disabled = true;
        toggleButtonBottom.classList.add('disabled');
        toggleButtonBottom.textContent = '展开';
    });

    // 处理contenteditable div的键盘事件，确保Tab键正常工作
    rawJsonInput.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '  ');
        }
    });

    // 为输入框添加实时格式化功能
    rawJsonInput.addEventListener('input', function () {
        // 可以在这里添加防抖处理，避免频繁格式化
    });

    // HTML转义函数，用于安全地显示用户输入的内容
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 验证是否为有效的JSON数据
    /**
     * 校验 JSON 是否合法，返回错误信息（包含行号列号）
     * @param {any} input - 输入数据
     * @param {Object} options - 配置选项
     * @returns {{valid: boolean, error?: string, line?: number, column?: number}}
     */
    function isValidJSON(input, options = {}) {
        const { allowArrays = false, allowPrimitives = false } = options;

        // 处理非字符串输入
        if (typeof input !== 'string') {
            if (input === null || input === undefined) {
                return { valid: false, error: '输入为 null 或 undefined' };
            }
            if (typeof input === 'object' && !Array.isArray(input)) {
                return { valid: true };
            }
            return { valid: false, error: '输入必须是 JSON 字符串或对象' };
        }

        const str = input.trim();
        if (str === '') {
            return { valid: false, error: '输入为空字符串' };
        }

        try {
            const parsed = JSON.parse(str);

            // 验证解析后的类型
            if (parsed === null) {
                return { valid: false, error: 'JSON 不能为 null' };
            }
            if (Array.isArray(parsed) && !allowArrays) {
                return { valid: false, error: 'JSON 不能是数组' };
            }
            if (typeof parsed !== 'object' && !allowPrimitives) {
                return { valid: false, error: 'JSON 必须是对象' };
            }

            return { valid: true };

        } catch (error) {
            return parseJSONError(error, str);
        }
    }

    /**
     * 解析 JSON 错误信息，提取行号和列号
     */
    function parseJSONError(error, jsonString) {
        const message = error.message.toLowerCase();

        // 提取位置信息
        const positionMatch = error.message.match(/position\s+(\d+)/);
        const atPositionMatch = error.message.match(/at\s+position\s+(\d+)/);
        const charMatch = error.message.match(/at\s+character\s+(\d+)/);

        let position = null;
        if (positionMatch) position = parseInt(positionMatch[1]);
        else if (atPositionMatch) position = parseInt(atPositionMatch[1]);
        else if (charMatch) position = parseInt(charMatch[1]);

        if (position !== null) {
            const { line, column } = getLineAndColumn(jsonString, position);

            if (message.includes('unexpected token')) {
                const tokenMatch = error.message.match(/unexpected token\s+([^\s]+)/);
                const token = tokenMatch ? tokenMatch[1] : '未知字符';
                return {
                    valid: false,
                    error: `第 ${line} 行第 ${column} 列出现意外的字符: ${token}`,
                    line,
                    column
                };
            }

            if (message.includes('unexpected end')) {
                return {
                    valid: false,
                    error: `第 ${line} 行第 ${column} 列：JSON 不完整，意外结束`,
                    line,
                    column
                };
            }

            if (message.includes('expected')) {
                const expectedMatch = error.message.match(/expected\s+([^\\n]+)/);
                const expected = expectedMatch ? expectedMatch[1] : '特定字符';
                return {
                    valid: false,
                    error: `第 ${line} 行第 ${column} 列：期望 ${expected}`,
                    line,
                    column
                };
            }
        }

        // 通用错误处理
        if (message.includes('bad control character')) {
            return { valid: false, error: '包含非法控制字符' };
        }

        if (message.includes('bad escaped character')) {
            return { valid: false, error: '转义字符格式错误' };
        }

        if (message.includes('unterminated string')) {
            return { valid: false, error: '字符串没有正确结束引号' };
        }

        // 返回原始错误信息（简化版）
        const simpleError = error.message
            .replace(/^JSON\.parse:\s*/, '')
            .replace(/^SyntaxError:\s*/, '')
            .replace(/position\s+\d+/, '')
            .trim();

        return { valid: false, error: simpleError };
    }

    /**
     * 根据字符位置计算行号和列号
     */
    function getLineAndColumn(text, position) {
        if (position < 0 || position > text.length) {
            return { line: 1, column: 1 };
        }

        const lines = text.substring(0, position).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;

        return { line, column };
    }

    // 预处理JSON字符串，增强对转义符和格式问题的支持
    function preprocessJson(jsonStr) {
        let processed = jsonStr.trim();

        console.log('开始预处理JSON字符串...');

        // 尝试多种预处理策略
        const strategies = [
            {
                name: '原始字符串',
                fn: function (str) { return str; }
            },
            {
                name: '修复双重转义',
                fn: function (str) {
                    // 处理双重反斜杠
                    let fixed = str.replace(/\\\\/g, '\\');
                    // 修复转义的引号问题
                    fixed = fixed.replace(/\\"/g, '"');
                    return fixed;
                }
            },
            {
                name: '修复缺失引号的键',
                fn: function (str) {
                    // 尝试修复没有引号的键名，例如: {key: "value"} -> {"key": "value"}
                    try {
                        return str.replace(/([{,])\s*([a-zA-Z0-9_$]+)\s*:/g, '$1 "$2":');
                    } catch (e) {
                        return str;
                    }
                }
            },
            {
                name: '移除多余的逗号',
                fn: function (str) {
                    // 移除对象或数组末尾的逗号，例如: {"key": "value",} -> {"key": "value"}
                    return str
                        .replace(/,\s*}/g, '}')
                        .replace(/,\s*\]/g, ']');
                }
            },
            {
                name: '修复单引号问题',
                fn: function (str) {
                    // 将单引号转换为双引号，同时处理字符串内部的单引号
                    return str.replace(/'([^']*)'/g, '"$1"');
                }
            }
        ];

        // 尝试每种策略
        for (let i = 0; i < strategies.length; i++) {
            const strategy = strategies[i];
            try {
                console.log('尝试策略: ' + strategy.name);
                const testStr = strategy.fn(processed);
                // 验证策略是否成功
                JSON.parse(testStr);
                console.log('策略 ' + strategy.name + ' 成功!');
                return testStr;
            } catch (e) {
                console.log('策略 ' + strategy.name + ' 失败:', e.message);
                // 继续尝试下一个策略
            }
        }

        // 所有策略都失败，尝试一个综合修复方案
        try {
            console.log('尝试综合修复方案...');
            let combined = processed;

            // 应用多个修复策略
            combined = combined.replace(/\\\\/g, '\\'); // 修复双重反斜杠
            combined = combined.replace(/,\s*([}\]])/g, '$1'); // 移除尾部逗号

            // 处理特殊情况：如果字符串以引号开头和结尾，但中间有未转义的引号
            if (combined.startsWith('"') && combined.endsWith('"')) {
                try {
                    // 尝试解码URI组件
                    combined = decodeURIComponent(combined.slice(1, -1));
                } catch (e) {
                    console.log('URI解码失败:', e);
                }
            }

            // 最后验证
            JSON.parse(combined);
            console.log('综合修复方案成功!');
            return combined;
        } catch (e) {
            console.warn('所有修复方案均失败:', e);
        }

        // 所有尝试都失败，返回原始字符串
        return jsonStr;
    }

    // 改进的HTML实体解码函数
    function unescapeHtml(text) {
        try {
            // 使用DOMParser来更安全地处理HTML实体解码
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<!doctype html><body>${text}`, 'text/html');
            return doc.body.textContent || '';
        } catch (e) {
            console.error('HTML实体解码失败:', e);
            // 备选方案
            const div = document.createElement('div');
            div.innerHTML = text;
            return div.textContent;
        }
    }

    // 增强的JSON解析函数 - 专门处理折叠内容
    function enhancedParseJson(jsonStr) {
        try {
            // 检查参数是否有效
            if (!jsonStr || typeof jsonStr !== 'string') {
                console.warn('输入不是有效的字符串，使用空对象');
                return { "": "" };
            }

            console.log('原始JSON字符串:', jsonStr);

            // 先尝试多次HTML实体解码，确保完全解码
            let decodedStr = jsonStr;
            // 连续解码最多3次，直到没有HTML实体或达到最大次数
            let decodeAttempts = 0;
            while ((decodedStr.includes('&amp;') || decodedStr.includes('&lt;') || decodedStr.includes('&gt;') || decodedStr.includes('&quot;')) && decodeAttempts < 3) {
                decodedStr = unescapeHtml(decodedStr);
                decodeAttempts++;
                console.log(`第${decodeAttempts}次解码后:`, decodedStr);
            }

            // 尝试标准解析
            try {
                return JSON.parse(decodedStr);
            } catch (error) {
                console.error('标准解析失败，尝试清理后解析:', error);

                // 尝试清理可能的无效字符
                let cleanedStr = decodedStr.trim();

                // 如果字符串长度非常小，使用空对象
                if (cleanedStr.length < 5) {
                    console.warn('字符串长度太小，使用空对象 (长度: ' + cleanedStr.length + ')');
                    return { "": "" };
                }

                // 尝试再次解析清理后的字符串
                try {
                    return JSON.parse(cleanedStr);
                } catch (cleanedError) {
                    console.error('清理后解析仍失败:', cleanedError);
                    // 使用更宽松的解析方法
                    try {
                        // 对于Function构造函数的使用进行额外的安全检查
                        if (cleanedStr.trim() && (cleanedStr.startsWith('{') || cleanedStr.startsWith('['))) {
                            const parseFn = new Function('return ' + cleanedStr);
                            const result = parseFn();
                            console.log('宽松解析成功');
                            return result;
                        }
                    } catch (e) {
                        console.error('宽松解析也失败:', e);
                    }

                    // 作为最后的后备，返回一个空对象
                    return { "": "" };
                }
            }
        } catch (error) {
            console.error('增强解析失败:', error);
            // 作为最后的后备，返回一个空对象
            return { "": "" };
        }
    }

    // JSON语法高亮函数，支持左侧线和折叠图标
    function highlightJson(obj, depth = 0) {
        if (obj === null) {
            return '<span class="null">null</span>';
        }

        if (typeof obj === 'boolean') {
            return '<span class="boolean">' + obj + '</span>';
        }

        if (typeof obj === 'number') {
            return '<span class="number">' + obj + '</span>';
        }

        if (typeof obj === 'string') {
            // 转义HTML特殊字符
            const escapedStr = obj
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            return '<span class="string">"' + escapedStr + '"</span>';
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return '[]';
            }

            // 如果达到最大深度，折叠显示
            if (depth >= maxDepth) {
                return `[<span class="collapsed" data-content="${escapeHtml(JSON.stringify(obj))}">${obj.length} 项</span>]`;
            }

            // 保留适当的缩进并添加左侧线和折叠图标
            const indent = ' '.repeat(depth * 2);
            const itemIndent = ' '.repeat((depth + 1) * 2);
            let result = `<div class="json-container" data-depth="${depth}" data-type="array"><div class="json-item" style="margin-left: ${depth * indentNum}px; position: relative;"><div class="json-left-line" style="left: -20px;"><span class="collapse-icon expanded red-icon"></span></div><span class="bracket">[</span>`;

            // 如果数组不为空，添加内容
            if (obj.length > 0) {
                for (let i = 0; i < obj.length; i++) {
                    const item = obj[i];
                    // 对子元素应用折叠逻辑
                    const highlightedItem = highlightJson(item, depth + 1);
                    result += `</div><div class="json-item" style="margin-left: ${(depth + 1) * indentNum}px;">${highlightedItem}`;
                }
            }
            result += `</div><div class="json-item" style="margin-left: ${depth * indentNum}px; position: relative;"><div class="json-left-line" style="left: -20px;"></div><span class="bracket">]</span></div></div>`;
            return result;
        }

        if (typeof obj === 'object') {
            const keys = Object.keys(obj);

            if (keys.length === 0) {
                return '{}';
            }

            // 如果达到最大深度，折叠显示
            if (depth >= maxDepth) {
                return `{<span class="collapsed" data-content="${escapeHtml(JSON.stringify(obj))}">${keys.length} 个属性</span>}`;
            }

            // 保留适当的缩进并添加左侧线和折叠图标
            let result = `<div class="json-container" data-depth="${depth}" data-type="object"><div class="json-item" style="margin-left: ${depth * indentNum}px; position: relative;"><div class="json-left-line" style="left: -20px;"><span class="collapse-icon expanded red-icon"></span></div><span class="bracket">{</span>`;

            if (keys.length > 0) {
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const value = obj[key];
                    const highlightedKey = '<span class="key">"' + key + '"</span>';
                    // 对子值应用折叠逻辑
                    const highlightedValue = highlightJson(value, depth + 1);

                    result += `</div><div class="json-item" style="margin-left: ${(depth + 1) * indentNum}px;">${highlightedKey}: ${highlightedValue}`;
                    // if (i < keys.length - 1) {
                    //     result += ',';
                    // }
                }
            }
            result += `</div><div class="json-item" style="margin-left: ${depth * indentNum}px; position: relative;"><div class="json-left-line" style="left: -20px;"></div><span class="bracket">}</span></div></div>`;
            return result;
        }

        return String(obj);
    }

    // 用于折叠显示的JSON语法高亮函数
    function highlightJsonCollapsed(obj, depth = 0, maxDepth = 1) {
        if (obj === null) {
            return '<span class="null">null</span>';
        }

        if (typeof obj === 'boolean') {
            return '<span class="boolean">' + obj + '</span>';
        }

        if (typeof obj === 'number') {
            return '<span class="number">' + obj + '</span>';
        }

        if (typeof obj === 'string') {
            // 转义HTML特殊字符
            const escapedStr = obj
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            return '<span class="string">"' + escapedStr + '"</span>';
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                return '[]';
            }

            // 如果达到最大深度，折叠显示
            if (depth >= maxDepth) {
                return `[<span class="collapsed" data-content="${escapeHtml(JSON.stringify(obj))}">${obj.length} 项</span>]`;
            }

            // 保留适当的缩进并添加左侧线和折叠图标
            let result = `<div class="json-container" data-depth="${depth}" data-type="array"><div class="json-item" style="margin-left: ${depth * indentNum}px; position: relative;"><div class="json-left-line" style="left: -20px;"><span class="collapse-icon expanded red-icon"></span></div><span class="bracket">[</span>`;

            // 如果数组为空或只有简单元素，保持一行显示
            if (obj.length === 0) {
                result += ']</div></div>';
            } else {
                for (let i = 0; i < obj.length; i++) {
                    const item = obj[i];
                    // 对子元素应用折叠逻辑
                    const highlightedItem = highlightJsonCollapsed(item, depth + 1, maxDepth);
                    result += `</div><div class="json-item" style="margin-left: ${(depth + 1) * indentNum}px;">${highlightedItem}`;
                }
                result += `</div><div class="json-item" style="margin-left: ${depth * indentNum}px; position: relative;"><div class="json-left-line" style="left: -20px;"></div><span class="bracket">]</span></div></div>`;
            }
            return result;
        }

        if (typeof obj === 'object') {
            const keys = Object.keys(obj);

            if (keys.length === 0) {
                return '{}';
            }

            // 如果达到最大深度，折叠显示
            if (depth >= maxDepth) {
                return `{<span class="collapsed" data-content="${escapeHtml(JSON.stringify(obj))}">${keys.length} 个属性</span>}`;
            }

            // 保留适当的缩进并添加左侧线和折叠图标
            let result = `<div class="json-container" data-depth="${depth}" data-type="object"><div class="json-item" style="margin-left: ${depth * indentNum}px; position: relative;"><div class="json-left-line" style="left: -20px;"><span class="collapse-icon expanded red-icon"></span></div><span class="bracket">{</span>`;

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const value = obj[key];
                const highlightedKey = '<span class="key">"' + key + '"</span>';
                // 对子值应用折叠逻辑
                const highlightedValue = highlightJsonCollapsed(value, depth + 1, maxDepth);

                result += `</div><div class="json-item" style="margin-left: ${(depth + 1) * indentNum}px;">${highlightedKey}: ${highlightedValue}`;
            }

            result += `</div><div class="json-item" style="margin-left: ${depth * indentNum}px; position: relative;"><div class="json-left-line" style="left: -20px;"></div><span class="bracket">}</span></div></div>`;
            return result;
        }

        return String(obj);
    }

    // 复制按钮点击事件
    function handleCopy() {
        let textToCopy = '';

        // 优先使用格式化时保存的原始JSON数据（这是最准确的）
        if (rawJsonInput.dataset.originalJson) {
            try {
                // 解析保存的JSON字符串，然后以2空格缩进重新格式化
                const parsedJson = JSON.parse(rawJsonInput.dataset.originalJson);
                textToCopy = JSON.stringify(parsedJson, null, 2);
            } catch (e) {
                console.warn('解析保存的原始JSON失败:', e);
                // 如果解析失败，回退到获取编辑器中的文本内容
                textToCopy = rawJsonInput.textContent;
            }
        } else {
            // 如果没有保存的原始JSON数据，直接获取编辑器中的文本内容
            textToCopy = rawJsonInput.textContent;
        }

        if (!textToCopy.trim()) {
            showNotification('没有内容可复制');
            return;
        }

        // 使用Clipboard API复制文本
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // 清空错误提示
                errorMessage.textContent = '';
                errorMessage.classList.remove('show');
                showNotification('已复制到剪贴板');
            })
            .catch(err => {
                console.error('复制失败:', err);
                showNotification('复制失败，请手动复制');
            });
    }

    // 上方复制按钮点击事件
    copyButton.addEventListener('click', handleCopy);

    // 下方复制按钮点击事件
    copyButtonBottom.addEventListener('click', handleCopy);

    // 底部粘贴按钮点击事件
    pasteButtonBottom.addEventListener('click', function () {
        pasteButton.click();
    });

    // 底部格式化按钮点击事件
    formatButtonBottom.addEventListener('click', function () {
        formatButton.click();
    });

    // 底部折叠按钮点击事件
    toggleButtonBottom.addEventListener('click', function () {
        toggleButton.click();
    });

    // 底部压缩按钮点击事件
    minifyButtonBottom.addEventListener('click', function () {
        minifyButton.click();
    });

    // 底部转义按钮点击事件
    escapeButtonBottom.addEventListener('click', function () {
        escapeButton.click();
    });

    // 底部清空按钮点击事件
    clearButtonBottom.addEventListener('click', function () {
        clearButton.click();
    });

    // 粘贴按钮点击事件
    pasteButton.addEventListener('click', function () {
        // 使用Clipboard API读取剪贴板内容
        navigator.clipboard.readText()
            .then(text => {
                if (!text.trim()) {
                    showNotification('剪贴板为空');
                    return;
                }

                // 保存当前的滚动位置
                const scrollTop = rawJsonInput.scrollTop;

                // 确保输入框是可编辑的
                rawJsonInput.contentEditable = 'true';

                // 清空当前内容
                rawJsonInput.textContent = '';

                // 尝试解析剪贴板内容是否为JSON
                try {
                    // 预处理输入，移除可能导致问题的字符
                    let preprocessedText = text
                        // 移除行首和行尾的空白字符
                        .trim()
                        // 处理UTF-8 BOM
                        .replace(/^\uFEFF/, '')
                        // 规范化换行符
                        .replace(/\r\n/g, '\n');

                    // 尝试解析JSON
                    const parsedJson = JSON.parse(preprocessedText);

                    // 如果解析成功，使用格式化后的文本
                    const formattedJson = JSON.stringify(parsedJson, null, 2);
                    rawJsonInput.textContent = formattedJson;
                    showNotification('已粘贴并格式化JSON内容');
                } catch (e) {
                    // 尝试使用增强的JSON解析方法
                    try {
                        const enhancedParsedJson = enhancedParseJson(text);
                        const formattedJson = JSON.stringify(enhancedParsedJson, null, 2);
                        rawJsonInput.textContent = formattedJson;
                        showNotification('已使用增强方法粘贴并格式化JSON内容');
                    } catch (enhancedError) {
                        // 如果不是有效的JSON，直接粘贴原始内容
                        rawJsonInput.textContent = text;
                        showNotification('已从剪贴板粘贴内容（非JSON格式）');
                    }
                }

                // 清空保存的原始JSON数据
                delete rawJsonInput.dataset.originalJson;

                // 恢复滚动位置
                rawJsonInput.scrollTop = scrollTop;

                // 清空错误提示
                errorMessage.textContent = '';
                errorMessage.classList.remove('show');

                // 强制更新行号 - 确保DOM已经完全更新
                setTimeout(() => {
                    // 确保line-numbers元素存在
                    const lineNumbers = document.getElementById('line-numbers');
                    if (lineNumbers) {
                        // 确保行号容器样式正确
                        lineNumbers.style.display = 'block';
                        lineNumbers.style.visibility = 'visible';
                        lineNumbers.style.overflow = 'auto';

                        console.log('尝试更新行号...');
                        updateLineNumbers();
                        console.log('行号已更新');

                        // 同步滚动
                        syncScroll();

                        // 直接刷新显示，强制浏览器重排
                        lineNumbers.offsetHeight; // 触发重排
                    } else {
                        console.error('行号容器不存在');
                    }
                }, 100);

                // 立即尝试更新行号（不等待）
                updateLineNumbers();

                // 清空后禁用折叠按钮并改为'展开'
                toggleButton.disabled = true;
                toggleButton.classList.add('disabled');
                toggleButton.textContent = '展开';
            })
            .catch(err => {
                console.error('粘贴失败:', err);
                showNotification('粘贴失败，请手动粘贴');
            });
    });

    // 压缩按钮点击事件
    minifyButton.addEventListener('click', function () {
        // 首先检查是否有保存的原始JSON数据
        let rawJson;
        if (rawJsonInput.dataset.originalJson) {
            rawJson = rawJsonInput.dataset.originalJson;
        } else {
            rawJson = rawJsonInput.textContent.trim();
        }

        if (!rawJson) {
            showNotification('请输入JSON数据');
            return;
        }

        try {
            // 尝试使用标准方法处理
            // 预处理JSON字符串
            let processedJson = preprocessJson(rawJson);
            // 解析JSON
            const parsedJson = enhancedParseJson(processedJson);
            // 生成压缩后的JSON字符串（无空格和换行）
            const minifiedJson = JSON.stringify(parsedJson);

            // 保存当前的滚动位置
            const scrollTop = rawJsonInput.scrollTop;

            // 禁用contenteditable以便设置内容
            rawJsonInput.contentEditable = 'true';

            // 直接设置压缩后的字符串内容（不使用语法高亮）
            rawJsonInput.textContent = minifiedJson;

            // 清空保存的原始JSON数据
            delete rawJsonInput.dataset.originalJson;

            // 恢复滚动位置
            rawJsonInput.scrollTop = scrollTop;

            // 清空错误提示
            errorMessage.textContent = '';
            errorMessage.classList.remove('show');
            // showNotification('JSON已压缩');

            // 禁用折叠按钮并改为'展开'
            toggleButton.disabled = true;
            toggleButton.classList.add('disabled');
            toggleButton.textContent = '展开';

            // 同时禁用底部折叠按钮
            toggleButtonBottom.disabled = true;
            toggleButtonBottom.classList.add('disabled');
            toggleButtonBottom.textContent = '展开';
        } catch (error) {
            console.warn('标准压缩方法失败，尝试保留转义字符方式压缩:', error);
            try {
                // 如果标准方法失败，尝试直接处理当前输入内容
                // 这种方式会保留所有的转义字符
                const currentContent = rawJsonInput.textContent.trim();

                if (!currentContent) {
                    showNotification('请输入JSON数据');
                    return;
                }

                // 保存当前的滚动位置
                const scrollTop = rawJsonInput.scrollTop;

                // 禁用contenteditable以便设置内容
                rawJsonInput.contentEditable = 'true';

                // 直接使用当前内容作为压缩结果，保留所有转义字符
                rawJsonInput.textContent = currentContent;

                // 清空保存的原始JSON数据
                delete rawJsonInput.dataset.originalJson;

                // 恢复滚动位置
                rawJsonInput.scrollTop = scrollTop;

                // showNotification('JSON已保留转义字符方式压缩');
            } catch (innerError) {
                console.error('JSON压缩失败:', innerError);
                errorMessage.textContent = `JSON压缩错误: ${innerError.message}`;
                errorMessage.classList.add('show');
            }
        }
    });

    // 转义按钮点击事件
    escapeButton.addEventListener('click', function () {
        // 首先检查是否有保存的原始JSON数据
        let rawJson;
        if (rawJsonInput.dataset.originalJson) {
            rawJson = rawJsonInput.dataset.originalJson;
        } else {
            rawJson = rawJsonInput.textContent.trim();
        }

        if (!rawJson) {
            showNotification('请输入JSON数据');
            return;
        }

        try {
            // 预处理JSON字符串
            let processedJson = preprocessJson(rawJson);

            // 对字符串中的引号进行转义，只在引号前添加一个反斜杠
            const escapedJsonString = processedJson.replace(/"/g, '\\"');

            // 保存当前的滚动位置
            const scrollTop = rawJsonInput.scrollTop;

            // 禁用contenteditable以便设置内容
            rawJsonInput.contentEditable = 'true';

            // 直接设置转义后的字符串内容（不使用语法高亮）
            rawJsonInput.textContent = escapedJsonString;

            // 转义后不保存原始JSON数据，确保复制时获取的是转义后的字符串
            delete rawJsonInput.dataset.originalJson;

            // 恢复滚动位置
            rawJsonInput.scrollTop = scrollTop;

            // 清空错误提示
            errorMessage.textContent = '';
            errorMessage.classList.remove('show');
            // showNotification('JSON已转义');

            // 禁用折叠按钮并改为'展开'
            toggleButton.disabled = true;
            toggleButton.classList.add('disabled');
            toggleButton.textContent = '展开';
        } catch (error) {
            console.error('JSON转义失败:', error);
            errorMessage.textContent = `JSON转义错误: ${error.message}`;
            errorMessage.classList.add('show');
        }
    });

    // 切换按钮点击事件（折叠/展开互斥）
    toggleButton.addEventListener('click', function () {
        try {
            // 检查是否有折叠元素（包括折叠图标和折叠内容）
            const hasCollapsedIcons = rawJsonInput.querySelector('.collapse-icon.collapsed') !== null;
            const hasCollapsedContent = rawJsonInput.querySelector('.collapsed[data-content]') !== null;
            const hasCollapsedElements = hasCollapsedIcons || hasCollapsedContent;

            if (hasCollapsedElements) {
                // 如果有折叠元素，执行展开操作
                let parsedJson = null;

                // 首先尝试使用保存的原始JSON数据（最可靠的来源）
                if (rawJsonInput.dataset.originalJson) {
                    try {
                        parsedJson = JSON.parse(rawJsonInput.dataset.originalJson);
                    } catch (e) {
                        console.warn('解析保存的原始JSON失败，尝试从data-content获取:', e);
                    }
                }

                // 如果原始数据解析失败，尝试从折叠元素的data-content属性获取JSON
                if (!parsedJson) {
                    const collapsedElement = rawJsonInput.querySelector('.collapsed[data-content]');
                    if (collapsedElement) {
                        const content = collapsedElement.getAttribute('data-content');
                        if (content) {
                            try {
                                // 尝试直接解析data-content属性
                                parsedJson = JSON.parse(content);
                            } catch (e) {
                                // 如果直接解析失败，尝试进行HTML实体解码后再解析
                                try {
                                    const decodedContent = unescapeHtml(content);
                                    parsedJson = JSON.parse(decodedContent);
                                } catch (e2) {
                                    // 解码后仍然失败，放弃使用data-content
                                    console.warn('从data-content获取JSON失败:', e2);
                                }
                            }
                        }
                    }
                }

                // 如果以上方法都失败，才使用textContent（这是最不可靠的来源）
                if (!parsedJson) {
                    const inputText = rawJsonInput.textContent.trim();

                    // 检查输入是否为空
                    if (!inputText) {
                        throw new Error('请输入JSON内容');
                    }

                    // 预处理输入，只提取可能的JSON部分
                    let jsonToParse = inputText
                        .trim()
                        .replace(/^\uFEFF/, '')
                        .replace(/\r\n/g, '\n');

                    // 尝试使用增强的JSON解析方法
                    parsedJson = enhancedParseJson(jsonToParse);
                }

                // 生成展开的HTML
                const expandedHtml = highlightJson(parsedJson);

                // 安全地替换内容
                if (expandedHtml) {
                    // 保存当前的滚动位置
                    const scrollTop = rawJsonInput.scrollTop;

                    // 设置编辑器为只读
                    rawJsonInput.contentEditable = 'false';

                    // 更新编辑器内容
                    rawJsonInput.innerHTML = expandedHtml;

                    // 恢复滚动位置
                    rawJsonInput.scrollTop = scrollTop;

                    // 空错误提示
                    errorMessage.textContent = '';
                    errorMessage.classList.remove('show');

                    // 添加-符号到[和{前面
                    // setTimeout(() => {
                    //     addMinusSigns();
                    // }, 0);

                    // 展开操作完成后，将按钮文本改为"折叠"
                    toggleButton.textContent = '折叠';
                } else {
                    throw new Error('生成展开HTML失败');
                }
            } else {
                // 如果没有折叠元素，执行折叠操作
                // 首先尝试使用保存的原始JSON数据
                let parsedJson = null;

                // 检查是否有保存的原始JSON数据
                if (rawJsonInput.dataset.originalJson) {
                    try {
                        // 直接使用保存的原始JSON数据，避免再次解析可能导致的问题
                        parsedJson = JSON.parse(rawJsonInput.dataset.originalJson);
                    } catch (e) {
                        console.warn('解析保存的原始JSON失败，尝试从textContent获取:', e);
                        // 如果解析失败，再尝试其他方法
                        const inputText = rawJsonInput.textContent.trim();

                        if (!inputText) {
                            showNotification('请输入JSON数据');
                            return;
                        }

                        // 预处理JSON字符串
                        const jsonToParse = preprocessJson(inputText);

                        // 解析JSON
                        parsedJson = enhancedParseJson(jsonToParse);
                    }
                } else {
                    // 如果没有保存的原始数据，才使用当前文本内容
                    const inputText = rawJsonInput.textContent.trim();

                    if (!inputText) {
                        showNotification('请输入JSON数据');
                        return;
                    }

                    // 预处理JSON字符串
                    const jsonToParse = preprocessJson(inputText);

                    // 解析JSON
                    parsedJson = enhancedParseJson(jsonToParse);
                }

                // 生成HTML，但特殊处理：将第一个{包含的所有节点合起来
                let collapsedHtml = '';

                // 检查根节点是否是对象
                if (typeof parsedJson === 'object' && parsedJson !== null && !Array.isArray(parsedJson)) {
                    // 获取对象的键
                    const keys = Object.keys(parsedJson);

                    if (keys.length > 0) {
                        // 只显示对象的开始括号，并将整个内容折叠
                        collapsedHtml = `<div class="json-container" data-depth="0" data-type="object"><div class="json-item" style="margin-left: 0px; position: relative;"><div class="json-left-line" style="left: -20px;"><span class="collapse-icon expanded red-icon"></span></div><span class="bracket">{</span><span class="collapsed" data-content="${escapeHtml(JSON.stringify(parsedJson))}">${keys.length} 个属性</span></div><div class="json-item" style="margin-left: 0px; position: relative;"><div class="json-left-line" style="left: -20px;"></div><span class="bracket">}</span></div></div>`;
                    }
                } else {
                    // 如果根节点不是对象，使用普通的折叠方法 
                    collapsedHtml = highlightJsonCollapsed(parsedJson);
                }

                // 保存当前的滚动位置
                const scrollTop = rawJsonInput.scrollTop;

                // 禁用contenteditable以便设置HTML内容
                rawJsonInput.contentEditable = 'false';

                // 设置折叠的HTML内容
                rawJsonInput.innerHTML = collapsedHtml;

                // 恢复滚动位置
                rawJsonInput.scrollTop = scrollTop;

                // 确保事件委托正确绑定
                if (typeof _delegateHandler === 'function') {
                    // 移除所有可能的旧事件监听器
                    rawJsonInput.removeEventListener('click', rawJsonInput._delegateHandler);
                    rawJsonInput.removeEventListener('click', _delegateHandler);

                    // 重新绑定主事件委托函数
                    rawJsonInput._delegateHandler = _delegateHandler;
                    rawJsonInput.addEventListener('click', _delegateHandler);
                }

                // 添加减号符号
                addMinusSigns();

                // 重新启用contenteditable
                rawJsonInput.contentEditable = 'true';

                // 清空错误提示
                errorMessage.textContent = '';
                errorMessage.classList.remove('show');

                // 折叠操作完成后，将按钮文本改为"展开"
                toggleButton.textContent = '展开';
            }
        } catch (error) {
            console.error('JSON切换失败:', error);
            // 确保恢复contenteditable状态
            rawJsonInput.contentEditable = 'true';
            // 显示错误信息
            errorMessage.textContent = `JSON切换错误: ${error.message}`;
            errorMessage.classList.add('show');
        }
    });

    // 为折叠图标添加点击事件处理函数
    function handleCollapseIconClick(e) {
        if (e.target.classList.contains('collapse-icon')) {
            e.stopPropagation();

            // 切换折叠/展开状态
            const isCollapsed = e.target.classList.toggle('collapsed');
            e.target.classList.toggle('expanded', !isCollapsed);

            // 找到对应的JSON容器
            const container = e.target.closest('.json-container');
            if (!container) return;

            // 获取类型（数组或对象）
            const type = container.dataset.type || 'object';

            // 找到所有子项
            const jsonItems = container.querySelectorAll('.json-item');

            // 处理折叠状态
            if (isCollapsed) {
                // 折叠状态
                // 保存原始内容以便展开时恢复
                if (!container.dataset.originalContent) {
                    container.dataset.originalContent = container.innerHTML;
                }

                // 折叠内容
                if (jsonItems.length > 2) {
                    // 找到第一个和最后一个元素（分别是开始括号和结束括号）
                    const firstItem = jsonItems[0];
                    const lastItem = jsonItems[jsonItems.length - 1];

                    // 只保留第一个和最后一个元素，隐藏中间的内容
                    for (let i = 1; i < jsonItems.length - 1; i++) {
                        jsonItems[i].style.display = 'none';
                    }

                    // 在开始括号后添加折叠指示器
                    const bracketSpan = firstItem.querySelector('.bracket');
                    if (bracketSpan && !firstItem.querySelector('.collapsed')) {
                        let collapsedCount = 0;
                        if (type === 'array') {
                            collapsedCount = jsonItems.length - 2; // 减去开始和结束括号
                        } else if (type === 'object') {
                            collapsedCount = Math.floor((jsonItems.length - 2) / 1); // 对象的键值对
                        }

                        const collapsedIndicator = document.createElement('span');
                        collapsedIndicator.className = 'collapsed';
                        collapsedIndicator.textContent = type === 'array' ? `${collapsedCount} 项` : `${collapsedCount} 个属性`;
                        bracketSpan.parentNode.insertBefore(collapsedIndicator, bracketSpan.nextSibling);
                    }
                }
            } else {
                // 展开状态
                // 不再使用innerHTML替换，而是直接修改现有元素的显示状态
                if (jsonItems.length > 2) {
                    // 找到所有子级内容（跳过开始括号和结束括号）
                    for (let i = 1; i < jsonItems.length - 1; i++) {
                        jsonItems[i].style.display = 'block';
                    }

                    // 移除折叠指示器
                    const collapsedIndicator = container.querySelector('.collapsed');
                    if (collapsedIndicator) {
                        collapsedIndicator.remove();
                    }
                }
                // 清除保存的原始内容
                container.dataset.originalContent = '';
            }

            // 更新全局折叠按钮状态
            updateToggleButtonState();
        }
    }

    // 更新折叠按钮状态的函数
    function updateToggleButtonState() {
        // 检查是否有任何折叠的图标
        const hasCollapsedIcons = rawJsonInput.querySelector('.collapse-icon.collapsed') !== null;
        // 检查是否有任何折叠的内容
        const hasCollapsedContent = rawJsonInput.querySelector('.collapsed[data-content]') !== null;

        // 如果有折叠的图标或内容，按钮文本应为"展开"
        if (hasCollapsedIcons || hasCollapsedContent) {
            toggleButton.textContent = '展开';
            toggleButtonBottom.textContent = '展开';
        } else {
            // 否则按钮文本应为"折叠"
            toggleButton.textContent = '折叠';
            toggleButtonBottom.textContent = '折叠';
        }
    }

    // 全局定义的事件委托处理函数
    function _delegateHandler(e) {
        // 检查是否是点击折叠图标
        if (e.target.classList.contains('collapse-icon')) {
            handleCollapseIconClick(e);
        }
        // 否则处理折叠内容点击
        else if (e.target.classList.contains('collapsed') && !e.target.classList.contains('collapse-icon')) {
            e.stopPropagation();
            try {
                // 获取内容并确保正确处理
                let content = e.target.getAttribute('data-content');
                // 即使内容为空，也使用一个默认的空对象，避免抛出错误
                if (!content || content.trim() === '') {
                    console.warn('折叠内容为空，使用默认空对象');
                    content = '{"": ""}';
                }

                // 尝试使用增强的解析方法
                let parsedContent;
                try {
                    parsedContent = enhancedParseJson(content);
                } catch (error) {
                    console.error('解析失败，使用默认空对象:', error);
                    // 如果解析失败，使用一个简单的空对象
                    parsedContent = { "": "" };
                }

                // 找到最近的容器
                const container = e.target.closest('.json-container');
                if (container) {
                    // 为depth提供默认值
                    const depth = parseInt(container.dataset.depth || 0);
                    // 生成并替换整个容器内容
                    container.innerHTML = highlightJson(parsedContent, depth);
                    // 确保重新绑定事件
                    addMinusSigns();
                } else {
                    // 直接替换当前元素
                    e.target.outerHTML = highlightJson(parsedContent);
                    // 确保重新绑定事件
                    addMinusSigns();
                }
            } catch (error) {
                console.error('展开折叠内容失败:', error);
                // 显示友好的错误提示
                showNotification('展开内容时出错: ' + error.message);
            }
        }
    }

    // 为JSON编辑器添加事件委托
    rawJsonInput.addEventListener('click', _delegateHandler);

    // 显示通知的函数
    function showNotification(message) {
        // 检查是否已存在通知元素
        let notification = document.getElementById('notification');

        if (!notification) {
            // 创建通知元素
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }

        // 设置通知内容
        notification.textContent = message;

        // 显示通知
        notification.classList.add('show');

        // 3秒后隐藏通知
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // 更新行号的函数
    function updateLineNumbers() {
        console.log('执行updateLineNumbers函数');
        const lineNumbers = document.getElementById('line-numbers');

        // 确保行号容器存在且样式正确
        if (!lineNumbers) {
            console.error('行号容器不存在');
            return;
        }

        // 强制设置行号容器的关键样式
        lineNumbers.style.display = 'block';
        lineNumbers.style.visibility = 'visible';
        lineNumbers.style.overflow = 'auto';
        lineNumbers.style.width = '60px';
        lineNumbers.style.backgroundColor = '#f5f5f5';
        lineNumbers.style.borderRight = '1px solid #ddd';
        lineNumbers.style.padding = '15px 5px';
        lineNumbers.style.textAlign = 'right';
        lineNumbers.style.fontFamily = 'Consolas, Monaco, Courier New, monospace';
        lineNumbers.style.fontSize = '14px';
        lineNumbers.style.lineHeight = '1.5';
        lineNumbers.style.color = '#999';
        lineNumbers.style.userSelect = 'none';
        lineNumbers.style.flexShrink = '0';

        console.log('lineNumbers元素:', lineNumbers);
        let lines = 1;

        // 尝试从不同来源获取内容来计算行数
        let textContent = rawJsonInput.textContent || '';
        let htmlContent = rawJsonInput.innerHTML || '';

        // 对于格式化后的内容，优先使用HTML内容计算行数
        if (htmlContent.trim()) {
            // 使用HTML内容计算行数
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.width = rawJsonInput.clientWidth + 'px';
            tempDiv.style.fontFamily = getComputedStyle(rawJsonInput).fontFamily;
            tempDiv.style.fontSize = getComputedStyle(rawJsonInput).fontSize;
            tempDiv.style.lineHeight = getComputedStyle(rawJsonInput).lineHeight;
            tempDiv.style.whiteSpace = 'pre-wrap';
            tempDiv.style.wordWrap = 'break-word';
            tempDiv.innerHTML = htmlContent;

            document.body.appendChild(tempDiv);

            // 计算行数
            const lineHeight = parseInt(getComputedStyle(tempDiv).lineHeight);
            const contentHeight = tempDiv.scrollHeight;
            lines = Math.max(1, Math.ceil(contentHeight / lineHeight));

            document.body.removeChild(tempDiv);
        } else if (textContent.trim()) {
            // 没有HTML内容但有文本内容时，使用文本内容计算行数
            lines = textContent.split('\n').length;
        }

        // 确保行号始终显示，至少显示10行，最多显示100行
        lines = Math.max(100, Math.min(lines, 2000));

        // 清空现有的行号
        lineNumbers.innerHTML = '';

        // 添加新的行号
        for (let i = 1; i <= lines; i++) {
            const lineNumber = document.createElement('div');
            lineNumber.className = 'line-number';
            lineNumber.textContent = i;
            lineNumbers.appendChild(lineNumber);
        }
        console.log('行号已更新');
    }

    // 同步滚动
    function syncScroll() {
        const lineNumbers = document.getElementById('line-numbers');
        lineNumbers.scrollTop = rawJsonInput.scrollTop;
    }

    // 初始化行号
    updateLineNumbers();

    // 添加事件监听器
    rawJsonInput.addEventListener('input', updateLineNumbers);
    rawJsonInput.addEventListener('scroll', syncScroll);

    // 添加DOM变化监听器，检测内容更新以自动显示行号
    // 特别是当格式化后的数据直接填充到输入框时
    if ('MutationObserver' in window) {
        const observer = new MutationObserver(function (mutations) {
            // 检查是否有内容变化
            for (let i = 0; i < mutations.length; i++) {
                if (mutations[i].type === 'childList' || mutations[i].type === 'characterData') {
                    // 延迟更新行号，确保DOM已经完全更新
                    setTimeout(updateLineNumbers, 50);
                    break;
                }
            }
        });

        // 配置观察选项
        const config = {
            childList: true,
            subtree: true,
            characterData: true
        };

        // 开始观察目标节点
        observer.observe(rawJsonInput, config);
    } else {
        // 降级方案：使用较旧的DOMSubtreeModified事件
        rawJsonInput.addEventListener('DOMSubtreeModified', function () {
            setTimeout(updateLineNumbers, 50);
        });
    }

    // 格式化按钮点击后更新行号
    formatButton.addEventListener('click', function () {
        setTimeout(updateLineNumbers, 100);
    });

    // 清空按钮点击后重置行号
    clearButton.addEventListener('click', function () {
        setTimeout(updateLineNumbers, 100);
    });

    // 页面加载完成后，让输入框自动获得焦点
    setTimeout(() => {
        rawJsonInput.focus();
    }, 0);
});


// 添加-符号到[和{前面的函数
// 从HTML内容中提取JSON数据 - 增强版
function extractJsonFromHtml(htmlContent) {
    try {
        // 创建临时元素来解析HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // 尝试多种方法提取JSON：

        // 方法1: 尝试获取collapsed元素中的data-content属性
        const collapsedElement = tempDiv.querySelector('.collapsed[data-content]');
        if (collapsedElement && collapsedElement.dataset.content) {
            try {
                // 解码HTML实体
                const decodedContent = unescapeHtml(collapsedElement.dataset.content);
                // 验证是否为有效的JSON
                JSON.parse(decodedContent);
                return decodedContent;
            } catch (e) {
                console.log('从collapsed元素提取JSON失败，尝试其他方法');
            }
        }

        // 方法2: 尝试获取原始文本内容
        let textContent = tempDiv.textContent.trim();

        // 预处理文本内容
        textContent = textContent
            .replace(/\s+/g, ' ') // 替换多余的空白字符
            .replace(/\s*{\s*/g, '{') // 移除括号周围的空白
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*\[\s*/g, '[')
            .replace(/\s*\]\s*/g, ']')
            .replace(/\s*:\s*/g, ':')
            .replace(/\s*,\s*/g, ',');

        // 如果内容看起来像JSON，直接返回
        if ((textContent.startsWith('{') && textContent.endsWith('}')) ||
            (textContent.startsWith('[') && textContent.endsWith(']'))) {
            try {
                // 验证是否为有效的JSON
                JSON.parse(textContent);
                return textContent;
            } catch (e) {
                console.log('文本内容看起来像JSON但解析失败，尝试修复');
                // 尝试修复常见问题
                textContent = textContent.replace(/([\w]+):/g, '"$1":'); // 修复没有引号的键
                try {
                    JSON.parse(textContent);
                    return textContent;
                } catch (e) {
                    console.log('修复后仍解析失败');
                }
            }
        }

        // 方法3: 尝试解析内容中的JSON字符串
        const jsonMatch = textContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                JSON.parse(jsonMatch[0]);
                return jsonMatch[0];
            } catch (e) {
                console.log('匹配到的内容不是有效的JSON');
            }
        }

        // 方法4: 尝试使用增强的JSON解析方法
        try {
            const parsed = enhancedParseJson(textContent);
            return JSON.stringify(parsed);
        } catch (e) {
            console.log('增强解析也失败');
        }

        // 如果都不行，返回原始文本
        return textContent;
    } catch (error) {
        console.error('从HTML中提取JSON失败:', error);
        return '';
    }
}

function addMinusSigns() {
    const brackets = document.querySelectorAll('.bracket');
    brackets.forEach(bracket => {
        const text = bracket.textContent;
        if (text.startsWith('[') || text.startsWith('{')) {
            // 检查是否已经添加了-符号
            if (!bracket.previousElementSibling || !bracket.previousElementSibling.classList.contains('minus-sign')) {
                const minusSign = document.createElement('span');
                minusSign.className = 'minus-sign';
                bracket.parentNode.insertBefore(minusSign, bracket);
            }
        }
    });
}

// 全屏功能实现 - 使用简单的最大化替代方案
window.toggleFullScreen = function () {
    try {
        // 明确使用全局作用域中的变量
        const editorContainer = window.editorContainer;
        const fullscreenButton = window.fullscreenButton;

        if (!editorContainer || !fullscreenButton) {
            console.error('找不到必要的DOM元素');
            return;
        }

        // 检查是否已经是最大化状态
        if (editorContainer.classList.contains('maximized')) {
            // 恢复普通大小
            editorContainer.classList.remove('maximized');
            fullscreenButton.textContent = '全屏';
        } else {
            // 最大化编辑器
            editorContainer.classList.add('maximized');
            fullscreenButton.textContent = '恢复';
        }
    } catch (err) {
        console.error('全屏切换失败:', err);
        alert('操作无法完成: ' + err.message);
    }
};