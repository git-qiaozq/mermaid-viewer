/**
 * Mermaid Viewer - 应用逻辑
 * 本地 Mermaid 图表和 Markdown 文档展示工具
 */

(function () {
    'use strict';

    // ========================================
    // 配置
    // ========================================
    const CONFIG = {
        MAX_HISTORY: 20,
        DEBOUNCE_DELAY: 500,
        STORAGE_KEY: 'mermaid-viewer-history',
        ZOOM_STEP: 0.1,
        ZOOM_MIN: 0.25,
        ZOOM_MAX: 3
    };

    // ========================================
    // 示例文件列表
    // ========================================
    const EXAMPLES = [
        { name: '流程图', file: 'flowchart.mmd', type: 'mermaid' },
        { name: '时序图', file: 'sequence.mmd', type: 'mermaid' },
        { name: '类图', file: 'class-diagram.mmd', type: 'mermaid' },
        { name: '状态图', file: 'state-diagram.mmd', type: 'mermaid' },
        { name: 'ER 图', file: 'er-diagram.mmd', type: 'mermaid' },
        { name: '甘特图', file: 'gantt.mmd', type: 'mermaid' },
        { name: '饼图', file: 'pie-chart.mmd', type: 'mermaid' },
        { name: '使用指南', file: 'sample-document.md', type: 'markdown' }
    ];

    // ========================================
    // 状态管理
    // ========================================
    const state = {
        mode: 'auto',           // 'auto' | 'mermaid' | 'markdown'
        currentZoom: 1,
        history: [],
        debounceTimer: null,
        mermaidCounter: 0,
        isFullscreen: false     // 全屏预览模式
    };

    // ========================================
    // DOM 元素引用
    // ========================================
    const elements = {
        codeInput: null,
        previewContent: null,
        previewWrapper: null,
        charCount: null,
        detectedType: null,
        zoomLevel: null,
        historyPanel: null,
        historyList: null,
        toastContainer: null,
        fileInput: null,
        mainContent: null,
        fullscreenBtn: null,
        examplesDropdown: null,
        examplesMenu: null
    };

    // ========================================
    // 初始化
    // ========================================
    function init() {
        // 获取 DOM 元素
        elements.codeInput = document.getElementById('code-input');
        elements.previewContent = document.getElementById('preview-content');
        elements.previewWrapper = document.getElementById('preview-wrapper');
        elements.charCount = document.querySelector('.char-count');
        elements.detectedType = document.querySelector('.detected-type');
        elements.zoomLevel = document.querySelector('.zoom-level');
        elements.historyPanel = document.getElementById('history-panel');
        elements.historyList = document.getElementById('history-list');
        elements.toastContainer = document.getElementById('toast-container');
        elements.fileInput = document.getElementById('file-input');
        elements.mainContent = document.querySelector('.main-content');
        elements.fullscreenBtn = document.getElementById('btn-fullscreen');
        elements.examplesDropdown = document.getElementById('examples-dropdown');
        elements.examplesMenu = document.getElementById('examples-menu');

        // 初始化 Mermaid
        initMermaid();

        // 初始化 Marked (Markdown 解析器)
        initMarked();

        // 加载历史记录
        loadHistory();

        // 绑定事件
        bindEvents();

        // 初始化分隔条拖动
        initResizer();
    }

    // ========================================
    // 初始化 Mermaid
    // ========================================
    function initMermaid() {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            themeVariables: {
                darkMode: true,
                background: '#0d1117',
                primaryColor: '#21262d',
                primaryTextColor: '#e6edf3',
                primaryBorderColor: '#39d4ff',
                secondaryColor: '#161b22',
                secondaryTextColor: '#8b949e',
                secondaryBorderColor: '#30363d',
                tertiaryColor: '#21262d',
                tertiaryTextColor: '#e6edf3',
                tertiaryBorderColor: '#a371f7',
                lineColor: '#8b949e',
                textColor: '#e6edf3',
                mainBkg: '#21262d',
                nodeBorder: '#39d4ff',
                clusterBkg: '#161b22',
                clusterBorder: '#30363d',
                titleColor: '#e6edf3',
                edgeLabelBackground: '#161b22',
                nodeTextColor: '#e6edf3',
                actorBorder: '#a371f7',
                actorBkg: '#21262d',
                actorTextColor: '#e6edf3',
                actorLineColor: '#6e7681',
                signalColor: '#e6edf3',
                signalTextColor: '#e6edf3',
                labelBoxBkgColor: '#21262d',
                labelBoxBorderColor: '#30363d',
                labelTextColor: '#e6edf3',
                loopTextColor: '#e6edf3',
                noteBorderColor: '#f0883e',
                noteBkgColor: '#21262d',
                noteTextColor: '#e6edf3',
                activationBorderColor: '#39d4ff',
                activationBkgColor: '#39d4ff',
                sequenceNumberColor: '#0d1117',
                sectionBkgColor: '#161b22',
                altSectionBkgColor: '#21262d',
                sectionBkgColor2: '#161b22',
                taskBorderColor: '#39d4ff',
                taskBkgColor: '#21262d',
                taskTextColor: '#e6edf3',
                taskTextLightColor: '#e6edf3',
                taskTextOutsideColor: '#e6edf3',
                taskTextClickableColor: '#39d4ff',
                activeTaskBorderColor: '#39d4ff',
                activeTaskBkgColor: '#39d4ff',
                gridColor: '#30363d',
                doneTaskBkgColor: '#3fb950',
                doneTaskBorderColor: '#3fb950',
                critBkgColor: '#f85149',
                critBorderColor: '#f85149',
                todayLineColor: '#f0883e',
                pie1: '#39d4ff',
                pie2: '#a371f7',
                pie3: '#3fb950',
                pie4: '#f0883e',
                pie5: '#f85149',
                pie6: '#8b949e',
                pie7: '#58a6ff',
                pie8: '#d2a8ff',
                pie9: '#7ee787',
                pie10: '#ffa657',
                pie11: '#ff7b72',
                pie12: '#c9d1d9'
            },
            flowchart: {
                htmlLabels: true,
                curve: 'basis',
                useMaxWidth: true
            },
            sequence: {
                useMaxWidth: true,
                diagramMarginX: 50,
                diagramMarginY: 10,
                actorMargin: 50,
                width: 150,
                height: 65,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35,
                mirrorActors: true
            },
            gantt: {
                useMaxWidth: true,
                leftPadding: 75,
                gridLineStartPadding: 35,
                barHeight: 20,
                barGap: 4,
                topPadding: 50,
                sidePadding: 75
            }
        });
    }

    // ========================================
    // 初始化 Marked (Markdown 解析器)
    // ========================================
    function initMarked() {
        // 配置 marked
        marked.setOptions({
            gfm: true,
            breaks: true,
            highlight: function (code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (e) {
                        console.error('Highlight error:', e);
                    }
                }
                return hljs.highlightAuto(code).value;
            }
        });

        // 自定义渲染器处理 Mermaid 代码块
        const renderer = new marked.Renderer();
        const originalCode = renderer.code.bind(renderer);

        renderer.code = function (code, language) {
            if (language === 'mermaid') {
                const id = `mermaid-embed-${state.mermaidCounter++}`;
                return `<div class="mermaid-embed" id="${id}">${escapeHtml(code)}</div>`;
            }
            return originalCode(code, language);
        };

        marked.setOptions({ renderer });
    }

    // ========================================
    // 事件绑定
    // ========================================
    function bindEvents() {
        // 输入框变化事件
        elements.codeInput.addEventListener('input', handleInputChange);

        // 文件上传
        elements.fileInput.addEventListener('change', handleFileUpload);
        
        // 上传按钮点击
        document.getElementById('btn-upload').addEventListener('click', () => {
            elements.fileInput.click();
        });

        // 模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => handleModeChange(btn.dataset.mode));
        });

        // 清空按钮
        document.getElementById('btn-clear').addEventListener('click', handleClear);

        // 导出按钮
        document.getElementById('btn-export-svg').addEventListener('click', () => exportImage('svg'));
        document.getElementById('btn-export-png').addEventListener('click', () => exportImage('png'));

        // 缩放按钮
        document.getElementById('btn-zoom-in').addEventListener('click', () => adjustZoom(CONFIG.ZOOM_STEP));
        document.getElementById('btn-zoom-out').addEventListener('click', () => adjustZoom(-CONFIG.ZOOM_STEP));
        document.getElementById('btn-zoom-reset').addEventListener('click', resetZoom);

        // 全屏预览按钮
        elements.fullscreenBtn.addEventListener('click', toggleFullscreen);

        // 历史记录按钮
        document.getElementById('btn-history').addEventListener('click', toggleHistory);
        document.getElementById('btn-history-close').addEventListener('click', closeHistory);
        document.getElementById('btn-history-clear').addEventListener('click', clearHistory);

        // 键盘快捷键
        document.addEventListener('keydown', handleKeydown);

        // 退出按钮
        document.getElementById('btn-exit').addEventListener('click', showExitModal);
        document.getElementById('btn-exit-cancel').addEventListener('click', hideExitModal);
        document.getElementById('btn-exit-confirm').addEventListener('click', shutdownServer);
        document.getElementById('exit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'exit-modal') hideExitModal();
        });

        // 支持拖拽文件
        elements.codeInput.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.codeInput.classList.add('drag-over');
        });

        elements.codeInput.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.codeInput.classList.remove('drag-over');
        });

        elements.codeInput.addEventListener('drop', handleFileDrop);

        // 示例下拉菜单
        document.getElementById('btn-examples').addEventListener('click', toggleExamplesDropdown);
        
        // 示例项点击事件
        elements.examplesMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const filename = item.dataset.example;
                if (filename) {
                    loadExample(filename);
                    closeExamplesDropdown();
                }
            });
        });

        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!elements.examplesDropdown.contains(e.target)) {
                closeExamplesDropdown();
            }
        });
    }

    // ========================================
    // 输入处理
    // ========================================
    function handleInputChange() {
        const content = elements.codeInput.value;

        // 更新字符计数
        elements.charCount.textContent = `${content.length} 字符`;

        // 检测内容类型
        const detectedType = detectContentType(content);
        updateDetectedType(detectedType);

        // 防抖渲染
        clearTimeout(state.debounceTimer);
        state.debounceTimer = setTimeout(() => {
            renderContent(content, detectedType);
        }, CONFIG.DEBOUNCE_DELAY);
    }

    // ========================================
    // 内容类型检测
    // ========================================
    function detectContentType(content) {
        if (state.mode !== 'auto') {
            return state.mode;
        }

        const trimmed = content.trim();
        if (!trimmed) return 'empty';

        // Mermaid 图表类型关键字
        const mermaidPatterns = [
            /^graph\s+(TB|BT|LR|RL|TD)/i,
            /^flowchart\s+(TB|BT|LR|RL|TD)/i,
            /^sequenceDiagram/i,
            /^classDiagram/i,
            /^stateDiagram/i,
            /^stateDiagram-v2/i,
            /^erDiagram/i,
            /^journey/i,
            /^gantt/i,
            /^pie/i,
            /^gitGraph/i,
            /^mindmap/i,
            /^timeline/i,
            /^quadrantChart/i,
            /^requirementDiagram/i,
            /^C4Context/i,
            /^sankey-beta/i
        ];

        for (const pattern of mermaidPatterns) {
            if (pattern.test(trimmed)) {
                return 'mermaid';
            }
        }

        // 检测 Markdown 特征
        const markdownPatterns = [
            /^#{1,6}\s/m,           // 标题
            /\*\*[^*]+\*\*/,        // 粗体
            /\*[^*]+\*/,            // 斜体
            /^\s*[-*+]\s/m,         // 无序列表
            /^\s*\d+\.\s/m,         // 有序列表
            /^\s*>/m,               // 引用
            /\[.+\]\(.+\)/,         // 链接
            /```[\s\S]*?```/,       // 代码块
            /`[^`]+`/,              // 行内代码
            /^\|.+\|$/m,            // 表格
            /^---$/m,               // 分隔线
            /!\[.*\]\(.+\)/         // 图片
        ];

        let markdownScore = 0;
        for (const pattern of markdownPatterns) {
            if (pattern.test(trimmed)) {
                markdownScore++;
            }
        }

        // 如果有多个 Markdown 特征，判定为 Markdown
        if (markdownScore >= 2) {
            return 'markdown';
        }

        // 默认尝试作为 Mermaid 渲染
        return 'mermaid';
    }

    // ========================================
    // 更新检测类型显示
    // ========================================
    function updateDetectedType(type) {
        const typeNames = {
            'empty': '等待输入',
            'auto': '自动检测',
            'mermaid': 'Mermaid',
            'markdown': 'Markdown'
        };
        elements.detectedType.textContent = typeNames[type] || type;
    }

    // ========================================
    // 内容渲染
    // ========================================
    async function renderContent(content, type) {
        if (!content.trim()) {
            showEmptyState();
            return;
        }

        try {
            if (type === 'mermaid') {
                await renderMermaid(content);
            } else {
                await renderMarkdown(content);
            }

            // 保存到历史记录
            saveToHistory(content, type);

        } catch (error) {
            showError(error.message || '渲染失败');
        }
    }

    // ========================================
    // 渲染 Mermaid
    // ========================================
    async function renderMermaid(content) {
        const id = `mermaid-${Date.now()}`;

        try {
            // 验证 Mermaid 语法
            const isValid = await mermaid.parse(content);
            if (!isValid) {
                throw new Error('Mermaid 语法错误');
            }

            // 渲染图表
            const { svg } = await mermaid.render(id, content);

            elements.previewContent.innerHTML = `
                <div class="mermaid-container">
                    ${svg}
                </div>
            `;

        } catch (error) {
            // 尝试获取更详细的错误信息
            let errorMsg = error.message || '未知错误';
            if (error.str) {
                errorMsg = error.str;
            }
            throw new Error(`Mermaid 渲染错误: ${errorMsg}`);
        }
    }

    // ========================================
    // 渲染 Markdown
    // ========================================
    async function renderMarkdown(content) {
        // 使用 marked 解析 Markdown
        const html = marked.parse(content);

        elements.previewContent.innerHTML = `
            <div class="markdown-preview">
                ${html}
            </div>
        `;

        // 渲染嵌入的 Mermaid 图表
        const mermaidEmbeds = elements.previewContent.querySelectorAll('.mermaid-embed');
        for (const embed of mermaidEmbeds) {
            try {
                const code = embed.textContent;
                const id = embed.id;
                const { svg } = await mermaid.render(id + '-svg', code);
                embed.innerHTML = svg;
            } catch (e) {
                embed.innerHTML = `<div class="error-message">Mermaid 渲染错误: ${e.message}</div>`;
            }
        }
    }

    // ========================================
    // 显示空状态
    // ========================================
    function showEmptyState() {
        elements.previewContent.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                </svg>
                <p>输入内容后将在此处显示预览</p>
            </div>
        `;
    }

    // ========================================
    // 显示错误
    // ========================================
    function showError(message) {
        elements.previewContent.innerHTML = `
            <div class="error-message">${escapeHtml(message)}</div>
        `;
    }

    // ========================================
    // 模式切换
    // ========================================
    function handleModeChange(mode) {
        state.mode = mode;

        // 更新按钮状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // 重新渲染
        handleInputChange();
    }

    // ========================================
    // 清空内容
    // ========================================
    function handleClear() {
        elements.codeInput.value = '';
        handleInputChange();
        showToast('内容已清空', 'info');
    }

    // ========================================
    // 文件上传处理
    // ========================================
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            readFile(file);
        }
        // 重置 input，允许重复选择同一文件
        event.target.value = '';
    }

    // ========================================
    // 文件拖拽处理
    // ========================================
    function handleFileDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        elements.codeInput.classList.remove('drag-over');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            readFile(files[0]);
        }
    }

    // ========================================
    // 示例下拉菜单控制
    // ========================================
    function toggleExamplesDropdown() {
        elements.examplesDropdown.classList.toggle('open');
    }

    function closeExamplesDropdown() {
        elements.examplesDropdown.classList.remove('open');
    }

    // ========================================
    // 加载示例文件
    // ========================================
    async function loadExample(filename) {
        try {
            const response = await fetch(`/examples/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const content = await response.text();
            
            // 设置内容到编辑器
            elements.codeInput.value = content;
            handleInputChange();
            
            // 查找示例名称
            const example = EXAMPLES.find(e => e.file === filename);
            const exampleName = example ? example.name : filename;
            showToast(`已加载示例: ${exampleName}`, 'success');
        } catch (error) {
            console.error('加载示例失败:', error);
            showToast(`加载示例失败: ${error.message}`, 'error');
        }
    }

    // ========================================
    // 读取文件
    // ========================================
    function readFile(file) {
        const allowedExtensions = ['.md', '.mmd', '.txt', '.markdown'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            showToast('不支持的文件格式，请上传 .md, .mmd, .txt 文件', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            elements.codeInput.value = e.target.result;
            handleInputChange();
            showToast(`已加载文件: ${file.name}`, 'success');
        };
        reader.onerror = () => {
            showToast('文件读取失败', 'error');
        };
        reader.readAsText(file);
    }

    // ========================================
    // 导出图片
    // ========================================
    async function exportImage(format) {
        const svgElement = elements.previewContent.querySelector('svg');
        if (!svgElement) {
            showToast('没有可导出的图表', 'error');
            return;
        }

        try {
            if (format === 'svg') {
                exportSVG(svgElement);
            } else {
                await exportPNG(svgElement);
            }
        } catch (error) {
            showToast(`导出失败: ${error.message}`, 'error');
        }
    }

    // ========================================
    // 导出 SVG
    // ========================================
    async function exportSVG(svgElement) {
        // 克隆 SVG
        const clonedSvg = svgElement.cloneNode(true);

        // 添加背景色
        clonedSvg.style.backgroundColor = '#0d1117';

        // 获取 SVG 字符串
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

        // 生成默认文件名
        const defaultFilename = `mermaid-${formatDateForFilename()}.svg`;

        // 使用另存为对话框下载
        const success = await saveFileWithDialog(svgBlob, defaultFilename, {
            description: 'SVG 图片',
            accept: { 'image/svg+xml': ['.svg'] }
        });
        
        if (success) {
            showToast('SVG 导出成功', 'success');
        }
    }

    // ========================================
    // 导出 PNG
    // ========================================
    async function exportPNG(svgElement) {
        // 克隆 SVG 以获取完整尺寸
        const clonedSvg = svgElement.cloneNode(true);
        
        // 获取 SVG 的实际尺寸（优先使用 viewBox，其次使用 width/height 属性）
        let svgWidth, svgHeight;
        
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
            const parts = viewBox.split(/\s+|,/);
            svgWidth = parseFloat(parts[2]);
            svgHeight = parseFloat(parts[3]);
        }
        
        // 如果没有 viewBox，尝试获取 width/height 属性
        if (!svgWidth || !svgHeight) {
            const widthAttr = svgElement.getAttribute('width');
            const heightAttr = svgElement.getAttribute('height');
            
            if (widthAttr && heightAttr) {
                svgWidth = parseFloat(widthAttr);
                svgHeight = parseFloat(heightAttr);
            }
        }
        
        // 如果还是获取不到，使用 getBBox() 获取实际内容边界
        if (!svgWidth || !svgHeight) {
            try {
                const bbox = svgElement.getBBox();
                svgWidth = bbox.width + bbox.x * 2;
                svgHeight = bbox.height + bbox.y * 2;
            } catch (e) {
                // 最后的回退方案：使用 getBoundingClientRect
                const rect = svgElement.getBoundingClientRect();
                svgWidth = rect.width;
                svgHeight = rect.height;
            }
        }
        
        // 确保尺寸有效
        svgWidth = Math.max(svgWidth, 100);
        svgHeight = Math.max(svgHeight, 100);
        
        // 设置克隆 SVG 的尺寸属性，确保完整渲染
        clonedSvg.setAttribute('width', svgWidth);
        clonedSvg.setAttribute('height', svgHeight);
        
        // 添加背景色
        clonedSvg.style.backgroundColor = '#0d1117';
        
        // 创建 canvas
        const scale = 2; // 高清导出
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;

        // 设置背景色
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 将 SVG 转换为图片
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
        const imgSrc = `data:image/svg+xml;base64,${svgBase64}`;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

                canvas.toBlob(async (blob) => {
                    // 生成默认文件名
                    const defaultFilename = `mermaid-${formatDateForFilename()}.png`;
                    
                    // 使用另存为对话框下载
                    const success = await saveFileWithDialog(blob, defaultFilename, {
                        description: 'PNG 图片',
                        accept: { 'image/png': ['.png'] }
                    });
                    
                    if (success) {
                        showToast('PNG 导出成功', 'success');
                    }
                    resolve();
                }, 'image/png');
            };
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = imgSrc;
        });
    }

    // ========================================
    // 使用另存为对话框保存文件
    // ========================================
    async function saveFileWithDialog(blob, suggestedName, fileType) {
        // 检查是否支持 File System Access API
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: suggestedName,
                    types: [{
                        description: fileType.description,
                        accept: fileType.accept
                    }]
                });
                
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return true;
            } catch (err) {
                // 用户取消了保存对话框
                if (err.name === 'AbortError') {
                    showToast('已取消保存', 'info');
                    return false;
                }
                // 其他错误，回退到传统下载方式
                console.warn('File System Access API 失败，使用传统下载方式:', err);
                downloadBlobFallback(blob, suggestedName);
                return true;
            }
        } else {
            // 不支持 File System Access API，使用传统下载方式
            downloadBlobFallback(blob, suggestedName);
            return true;
        }
    }

    // ========================================
    // 传统下载方式（回退方案）
    // ========================================
    function downloadBlobFallback(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ========================================
    // 格式化日期用于文件名
    // ========================================
    function formatDateForFilename() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}_${hour}${minute}${second}`;
    }

    // ========================================
    // 缩放控制
    // ========================================
    function adjustZoom(delta) {
        state.currentZoom = Math.max(CONFIG.ZOOM_MIN, Math.min(CONFIG.ZOOM_MAX, state.currentZoom + delta));
        applyZoom();
    }

    function resetZoom() {
        state.currentZoom = 1;
        applyZoom();
    }

    function applyZoom() {
        elements.previewContent.style.transform = `scale(${state.currentZoom})`;
        elements.zoomLevel.textContent = `${Math.round(state.currentZoom * 100)}%`;
    }

    // ========================================
    // 全屏预览
    // ========================================
    function toggleFullscreen() {
        state.isFullscreen = !state.isFullscreen;
        
        if (state.isFullscreen) {
            elements.mainContent.classList.add('fullscreen-preview');
            elements.fullscreenBtn.classList.add('active');
            showToast('已进入全屏预览，按 ESC 或 F 键退出', 'info');
        } else {
            elements.mainContent.classList.remove('fullscreen-preview');
            elements.fullscreenBtn.classList.remove('active');
        }
    }

    function exitFullscreen() {
        if (state.isFullscreen) {
            state.isFullscreen = false;
            elements.mainContent.classList.remove('fullscreen-preview');
            elements.fullscreenBtn.classList.remove('active');
        }
    }

    // ========================================
    // 历史记录管理
    // ========================================
    function loadHistory() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (saved) {
                state.history = JSON.parse(saved);
                renderHistory();
            }
        } catch (e) {
            console.error('加载历史记录失败:', e);
            state.history = [];
        }
    }

    function saveHistory() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.history));
        } catch (e) {
            console.error('保存历史记录失败:', e);
        }
    }

    function saveToHistory(content, type) {
        if (!content.trim() || type === 'empty') return;

        // 检查是否已存在相同内容
        const existingIndex = state.history.findIndex(item => item.content === content);
        if (existingIndex !== -1) {
            // 移动到最前面
            const [existing] = state.history.splice(existingIndex, 1);
            existing.timestamp = Date.now();
            state.history.unshift(existing);
        } else {
            // 添加新记录
            state.history.unshift({
                id: Date.now(),
                content: content,
                type: type,
                timestamp: Date.now(),
                preview: content.substring(0, 100)
            });

            // 限制历史记录数量
            if (state.history.length > CONFIG.MAX_HISTORY) {
                state.history = state.history.slice(0, CONFIG.MAX_HISTORY);
            }
        }

        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (state.history.length === 0) {
            elements.historyList.innerHTML = `
                <div class="history-empty">
                    <p>暂无历史记录</p>
                </div>
            `;
            return;
        }

        elements.historyList.innerHTML = state.history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item-header">
                    <span class="history-item-type ${item.type}">${item.type === 'mermaid' ? 'Mermaid' : 'Markdown'}</span>
                    <span class="history-item-time">${formatTime(item.timestamp)}</span>
                    <button class="history-item-delete" data-id="${item.id}" title="删除">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="history-item-preview">${escapeHtml(item.preview)}</div>
            </div>
        `).join('');

        // 绑定点击事件
        elements.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.history-item-delete')) {
                    loadFromHistory(parseInt(item.dataset.id));
                }
            });
        });

        // 绑定删除事件
        elements.historyList.querySelectorAll('.history-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFromHistory(parseInt(btn.dataset.id));
            });
        });
    }

    function loadFromHistory(id) {
        const item = state.history.find(h => h.id === id);
        if (item) {
            elements.codeInput.value = item.content;
            handleInputChange();
            closeHistory();
            showToast('已加载历史记录', 'info');
        }
    }

    function deleteFromHistory(id) {
        state.history = state.history.filter(h => h.id !== id);
        saveHistory();
        renderHistory();
        showToast('已删除记录', 'info');
    }

    function clearHistory() {
        if (state.history.length === 0) return;

        state.history = [];
        saveHistory();
        renderHistory();
        showToast('历史记录已清空', 'info');
    }

    function toggleHistory() {
        elements.historyPanel.classList.toggle('open');
        document.getElementById('btn-history').classList.toggle('active');
    }

    function closeHistory() {
        elements.historyPanel.classList.remove('open');
        document.getElementById('btn-history').classList.remove('active');
    }

    // ========================================
    // 分隔条拖动
    // ========================================
    function initResizer() {
        const resizer = document.getElementById('resizer');
        const editorPanel = document.querySelector('.editor-panel');
        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizer.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const containerWidth = document.querySelector('.main-content').offsetWidth;
            const newWidth = (e.clientX / containerWidth) * 100;

            if (newWidth >= 20 && newWidth <= 80) {
                editorPanel.style.flex = 'none';
                editorPanel.style.width = `${newWidth}%`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    // ========================================
    // 退出功能
    // ========================================
    function showExitModal() {
        document.getElementById('exit-modal').classList.add('open');
    }

    function hideExitModal() {
        document.getElementById('exit-modal').classList.remove('open');
    }

    async function shutdownServer() {
        try {
            const response = await fetch('/api/shutdown', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                hideExitModal();
                // 显示关闭提示
                document.body.innerHTML = `
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        background: #0d1117;
                        color: #e6edf3;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        text-align: center;
                        padding: 20px;
                    ">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3fb950" stroke-width="2" style="margin-bottom: 24px;">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <h1 style="font-size: 24px; margin-bottom: 12px; color: #e6edf3;">服务器已关闭</h1>
                        <p style="font-size: 14px; color: #8b949e; margin-bottom: 24px;">感谢使用 Mermaid Viewer！</p>
                        <p style="font-size: 13px; color: #6e7681;">
                            如需再次使用，请运行 <code style="background: #21262d; padding: 2px 8px; border-radius: 4px; color: #39d4ff;">python server.py</code>
                        </p>
                    </div>
                `;
            } else {
                showToast('关闭服务器失败', 'error');
            }
        } catch (error) {
            // 网络错误可能是因为服务器已经关闭
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    background: #0d1117;
                    color: #e6edf3;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    text-align: center;
                    padding: 20px;
                ">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3fb950" stroke-width="2" style="margin-bottom: 24px;">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <h1 style="font-size: 24px; margin-bottom: 12px; color: #e6edf3;">服务器已关闭</h1>
                    <p style="font-size: 14px; color: #8b949e; margin-bottom: 24px;">感谢使用 Mermaid Viewer！</p>
                    <p style="font-size: 13px; color: #6e7681;">
                        如需再次使用，请运行 <code style="background: #21262d; padding: 2px 8px; border-radius: 4px; color: #39d4ff;">python server.py</code>
                    </p>
                </div>
            `;
        }
    }

    // ========================================
    // 键盘快捷键
    // ========================================
    function handleKeydown(e) {
        // Ctrl/Cmd + S: 保存到历史
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const content = elements.codeInput.value;
            if (content.trim()) {
                const type = detectContentType(content);
                saveToHistory(content, type);
                showToast('已保存到历史记录', 'success');
            }
        }

        // Ctrl/Cmd + E: 导出 SVG
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportImage('svg');
        }

        // Ctrl/Cmd + Shift + E: 导出 PNG
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            exportImage('png');
        }

        // Escape: 关闭面板/退出全屏
        if (e.key === 'Escape') {
            if (state.isFullscreen) {
                exitFullscreen();
            } else {
                closeHistory();
                hideExitModal();
            }
        }

        // F: 切换全屏预览（仅当不在输入框中时）
        if (e.key === 'f' || e.key === 'F') {
            if (document.activeElement !== elements.codeInput) {
                e.preventDefault();
                toggleFullscreen();
            }
        }

        // Ctrl/Cmd + H: 切换历史面板
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            toggleHistory();
        }
    }

    // ========================================
    // Toast 通知
    // ========================================
    function showToast(message, type = 'info') {
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `${icons[type]}<span>${escapeHtml(message)}</span>`;

        elements.toastContainer.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========================================
    // 工具函数
    // ========================================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;

        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ========================================
    // 启动应用
    // ========================================
    document.addEventListener('DOMContentLoaded', init);

})();

