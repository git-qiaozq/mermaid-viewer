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
        MAX_FAVORITES: 10,
        DEBOUNCE_DELAY: 500,
        STORAGE_KEY: 'mermaid-viewer-history',
        FAVORITES_KEY: 'mermaid-viewer-favorites',
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
        favorites: [],          // 收藏列表
        currentTab: 'favorites', // 当前标签页 'favorites' | 'history'
        pendingFavoriteId: null, // 待收藏的历史记录ID
        pendingDeleteFavoriteId: null, // 待删除的收藏ID
        debounceTimer: null,
        mermaidCounter: 0,
        isFullscreen: false,    // 全屏预览模式
        // 平移相关状态
        isPanning: false,
        panStart: { x: 0, y: 0 },
        panOffset: { x: 0, y: 0 },
        // 触摸相关状态
        isTouching: false,
        touchStartDistance: 0,
        touchStartZoom: 1,
        // 同步滚动状态
        isSyncScrolling: false,      // 是否正在同步滚动（防止循环触发）
        syncScrollEnabled: true,     // 是否启用同步滚动
        // 目录导航状态
        tocHideTimer: null           // 目录隐藏延时定时器
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
        favoritesList: null,
        favoritesCount: null,
        historyCount: null,
        favoriteModal: null,
        favoriteTitle: null,
        deleteFavoriteModal: null,
        toastContainer: null,
        fileInput: null,
        mainContent: null,
        fullscreenBtn: null,
        examplesDropdown: null,
        examplesMenu: null,
        helpModal: null,
        // TOC 目录导航
        tocContainer: null,
        tocTrigger: null,
        tocPanel: null,
        tocList: null
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
        elements.favoritesList = document.getElementById('favorites-list');
        elements.favoritesCount = document.getElementById('favorites-count');
        elements.historyCount = document.getElementById('history-count');
        elements.favoriteModal = document.getElementById('favorite-modal');
        elements.favoriteTitle = document.getElementById('favorite-title');
        elements.deleteFavoriteModal = document.getElementById('delete-favorite-modal');
        elements.toastContainer = document.getElementById('toast-container');
        elements.fileInput = document.getElementById('file-input');
        elements.mainContent = document.querySelector('.main-content');
        elements.fullscreenBtn = document.getElementById('btn-fullscreen');
        elements.examplesDropdown = document.getElementById('examples-dropdown');
        elements.examplesMenu = document.getElementById('examples-menu');
        elements.helpModal = document.getElementById('help-modal');
        // TOC 目录导航
        elements.tocContainer = document.getElementById('toc-container');
        elements.tocTrigger = document.getElementById('toc-trigger');
        elements.tocPanel = document.getElementById('toc-panel');
        elements.tocList = document.getElementById('toc-list');

        // 初始化主题
        initTheme();

        // 初始化 Mermaid
        initMermaid();

        // 初始化 Marked (Markdown 解析器)
        initMarked();

        // 加载收藏（必须在历史记录之前，因为历史记录需要显示收藏状态）
        loadFavorites();

        // 加载历史记录
        loadHistory();

        // 绑定事件
        bindEvents();

        // 初始化分隔条拖动
        initResizer();

        // 初始化预览区拖拽平移
        initPanning();

        // 初始化同步滚动
        initSyncScroll();

        // 初始化目录导航
        initTOC();
    }

    // ========================================
    // 初始化 Mermaid
    // ========================================

    // Mermaid 暗黑主题配置
    const MERMAID_DARK_THEME = {
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
        actorBorder: '#39d4ff',
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
        // 甘特图优化
        sectionBkgColor: '#1c2128',
        altSectionBkgColor: '#161b22',
        sectionBkgColor2: '#1c2128',
        taskBorderColor: '#39d4ff',
        taskBkgColor: '#2d333b',
        taskTextColor: '#e6edf3',
        taskTextLightColor: '#e6edf3',
        taskTextOutsideColor: '#e6edf3',
        taskTextClickableColor: '#58a6ff',
        activeTaskBorderColor: '#58a6ff',
        activeTaskBkgColor: '#388bfd',
        gridColor: '#373e47',
        doneTaskBkgColor: '#238636',
        doneTaskBorderColor: '#3fb950',
        critBkgColor: '#da3633',
        critBorderColor: '#f85149',
        todayLineColor: '#f0883e',
        // ER 图优化
        attributeBackgroundColorOdd: '#21262d',
        attributeBackgroundColorEven: '#2d333b',
        // 饼图颜色
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
    };

    // Mermaid 亮色主题配置
    const MERMAID_LIGHT_THEME = {
        darkMode: false,
        background: '#ffffff',
        primaryColor: '#eaeef2',
        primaryTextColor: '#1f2328',
        primaryBorderColor: '#0598bc',
        secondaryColor: '#f6f8fa',
        secondaryTextColor: '#59666e',
        secondaryBorderColor: '#d0d7de',
        tertiaryColor: '#eaeef2',
        tertiaryTextColor: '#1f2328',
        tertiaryBorderColor: '#8250df',
        lineColor: '#59666e',
        textColor: '#1f2328',
        mainBkg: '#eaeef2',
        nodeBorder: '#0598bc',
        clusterBkg: '#f6f8fa',
        clusterBorder: '#d0d7de',
        titleColor: '#1f2328',
        edgeLabelBackground: '#f6f8fa',
        nodeTextColor: '#1f2328',
        actorBorder: '#0598bc',
        actorBkg: '#eaeef2',
        actorTextColor: '#1f2328',
        actorLineColor: '#8c959f',
        signalColor: '#1f2328',
        signalTextColor: '#1f2328',
        labelBoxBkgColor: '#eaeef2',
        labelBoxBorderColor: '#d0d7de',
        labelTextColor: '#1f2328',
        loopTextColor: '#1f2328',
        noteBorderColor: '#bc4c00',
        noteBkgColor: '#fff8c5',
        noteTextColor: '#1f2328',
        activationBorderColor: '#0598bc',
        activationBkgColor: '#0598bc',
        sequenceNumberColor: '#ffffff',
        sectionBkgColor: '#f6f8fa',
        altSectionBkgColor: '#eaeef2',
        sectionBkgColor2: '#f6f8fa',
        taskBorderColor: '#0598bc',
        taskBkgColor: '#eaeef2',
        taskTextColor: '#1f2328',
        taskTextLightColor: '#1f2328',
        taskTextOutsideColor: '#1f2328',
        taskTextClickableColor: '#0969da',
        activeTaskBorderColor: '#0598bc',
        activeTaskBkgColor: '#0598bc',
        gridColor: '#d0d7de',
        doneTaskBkgColor: '#1a7f37',
        doneTaskBorderColor: '#1a7f37',
        critBkgColor: '#cf222e',
        critBorderColor: '#cf222e',
        todayLineColor: '#bc4c00',
        pie1: '#0598bc',
        pie2: '#8250df',
        pie3: '#1a7f37',
        pie4: '#bc4c00',
        pie5: '#cf222e',
        pie6: '#8c959f',
        pie7: '#0969da',
        pie8: '#a475f9',
        pie9: '#2da44e',
        pie10: '#d4a72c',
        pie11: '#fa4549',
        pie12: '#59666e'
    };

    function getMermaidThemeVariables() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        return currentTheme === 'dark' ? MERMAID_DARK_THEME : MERMAID_LIGHT_THEME;
    }

    function initMermaid() {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: getMermaidThemeVariables(),
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
    
    // 用于跟踪标题 ID，避免重复
    const headingIdCounter = {};
    
    /**
     * 将标题文本转换为锚点 ID
     * 支持中文和英文，处理特殊字符
     */
    function generateHeadingId(text) {
        // 移除 HTML 标签
        let id = text.replace(/<[^>]*>/g, '');
        // 转小写（仅英文部分）
        id = id.toLowerCase();
        // 将空格替换为连字符
        id = id.replace(/\s+/g, '-');
        // 移除不安全的字符，保留中文、字母、数字、连字符和下划线
        id = id.replace(/[^\u4e00-\u9fa5a-z0-9\-_]/g, '');
        // 移除首尾的连字符
        id = id.replace(/^-+|-+$/g, '');
        
        // 如果 ID 为空，使用默认值
        if (!id) {
            id = 'heading';
        }
        
        // 处理重复 ID
        if (headingIdCounter[id] !== undefined) {
            headingIdCounter[id]++;
            id = `${id}-${headingIdCounter[id]}`;
        } else {
            headingIdCounter[id] = 0;
        }
        
        return id;
    }
    
    /**
     * 重置标题 ID 计数器（每次渲染 Markdown 时调用）
     */
    function resetHeadingIdCounter() {
        for (const key in headingIdCounter) {
            delete headingIdCounter[key];
        }
    }
    
    function initMarked() {
        // 配置 marked - 适配 marked v15+ 的新 API
        marked.use({
            gfm: true,
            breaks: true,
            renderer: {
                // 处理代码块
                code({ text, lang }) {
                    // Mermaid 代码块
                    if (lang === 'mermaid') {
                        const id = `mermaid-embed-${state.mermaidCounter++}`;
                        return `<div class="mermaid-embed" id="${id}">${escapeHtml(text)}</div>`;
                    }
                    
                    // 其他代码块 - 使用 highlight.js 高亮
                    let highlighted;
                    const language = lang || '';
                    if (language && hljs.getLanguage(language)) {
                        try {
                            highlighted = hljs.highlight(text, { language }).value;
                        } catch (e) {
                            console.error('Highlight error:', e);
                            highlighted = escapeHtml(text);
                        }
                    } else {
                        highlighted = hljs.highlightAuto(text).value;
                    }
                    
                    const langClass = language ? ` class="language-${escapeHtml(language)}"` : '';
                    return `<pre><code${langClass}>${highlighted}</code></pre>\n`;
                },
                
                // 处理标题 - 自动添加 id 属性用于锚点跳转
                heading({ tokens, depth, text }) {
                    const id = generateHeadingId(text);
                    // 使用 marked.parseInline 递归渲染标题内的 tokens
                    const renderedText = marked.parseInline(tokens.map(t => t.raw).join(''));
                    return `<h${depth} id="${id}">${renderedText}</h${depth}>\n`;
                }
            }
        });
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
        document.getElementById('btn-copy').addEventListener('click', copyToClipboard);

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

        // 标签页切换
        document.getElementById('tab-favorites').addEventListener('click', () => switchTab('favorites'));
        document.getElementById('tab-history').addEventListener('click', () => switchTab('history'));

        // 收藏弹窗
        document.getElementById('btn-favorite-cancel').addEventListener('click', hideFavoriteModal);
        document.getElementById('btn-favorite-confirm').addEventListener('click', confirmAddFavorite);
        elements.favoriteModal.addEventListener('click', (e) => {
            if (e.target.id === 'favorite-modal') hideFavoriteModal();
        });

        // 删除收藏确认弹窗
        document.getElementById('btn-delete-favorite-cancel').addEventListener('click', hideDeleteFavoriteModal);
        document.getElementById('btn-delete-favorite-confirm').addEventListener('click', confirmDeleteFavorite);
        elements.deleteFavoriteModal.addEventListener('click', (e) => {
            if (e.target.id === 'delete-favorite-modal') hideDeleteFavoriteModal();
        });

        // 键盘快捷键（使用捕获阶段，优先于浏览器插件处理）
        document.addEventListener('keydown', handleKeydown, true);

        // 退出按钮
        document.getElementById('btn-exit').addEventListener('click', showExitModal);
        document.getElementById('btn-exit-cancel').addEventListener('click', hideExitModal);
        document.getElementById('btn-exit-confirm').addEventListener('click', shutdownServer);
        document.getElementById('exit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'exit-modal') hideExitModal();
        });

        // 帮助面板
        document.getElementById('btn-help').addEventListener('click', showHelpModal);
        document.getElementById('btn-help-close').addEventListener('click', hideHelpModal);

        // 主题切换
        document.getElementById('btn-theme').addEventListener('click', toggleTheme);
        elements.helpModal.addEventListener('click', (e) => {
            if (e.target.id === 'help-modal') hideHelpModal();
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

        // 检测 JSON（优先级较高，因为 JSON 有明确的格式）
        // 首先尝试直接解析
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                JSON.parse(trimmed);
                return 'json';
            } catch (e) {
                // 直接解析失败，尝试智能提取 JSON
                // 找到最后一个匹配的 } 或 ]
                const startChar = trimmed[0];
                const endChar = startChar === '{' ? '}' : ']';
                let depth = 0;
                let inString = false;
                let escapeNext = false;
                let lastValidEnd = -1;
                
                for (let i = 0; i < trimmed.length; i++) {
                    const char = trimmed[i];
                    
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    
                    if (char === '\\' && inString) {
                        escapeNext = true;
                        continue;
                    }
                    
                    if (char === '"') {
                        inString = !inString;
                        continue;
                    }
                    
                    if (inString) continue;
                    
                    if (char === '{' || char === '[') {
                        depth++;
                    } else if (char === '}' || char === ']') {
                        depth--;
                        if (depth === 0) {
                            lastValidEnd = i;
                        }
                    }
                }
                
                // 如果找到了完整的 JSON 结构
                if (lastValidEnd > 0) {
                    const extractedJson = trimmed.substring(0, lastValidEnd + 1);
                    try {
                        JSON.parse(extractedJson);
                        return 'json';
                    } catch (e2) {
                        // 提取的内容也不是有效 JSON，继续检测其他类型
                    }
                }
            }
        }

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

        // 对于标题等典型 Markdown 特征，放宽阈值避免误判为 Mermaid
        if (markdownScore >= 1) {
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
            'markdown': 'Markdown',
            'json': 'JSON'
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
            } else if (type === 'json') {
                renderJSON(content);
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
        // 移除 JSON 滚动同步
        removeJSONScrollSync();
        
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

            // Mermaid 图表没有标题，隐藏目录
            hideTOC();

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
    // 渲染 JSON
    // ========================================
    function renderJSON(content) {
        try {
            const trimmed = content.trim();
            let jsonContent = trimmed;
            let data;
            
            // 尝试直接解析
            try {
                data = JSON.parse(trimmed);
            } catch (e) {
                // 直接解析失败，尝试智能提取 JSON
                const startChar = trimmed[0];
                let depth = 0;
                let inString = false;
                let escapeNext = false;
                let lastValidEnd = -1;
                
                for (let i = 0; i < trimmed.length; i++) {
                    const char = trimmed[i];
                    
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    
                    if (char === '\\' && inString) {
                        escapeNext = true;
                        continue;
                    }
                    
                    if (char === '"') {
                        inString = !inString;
                        continue;
                    }
                    
                    if (inString) continue;
                    
                    if (char === '{' || char === '[') {
                        depth++;
                    } else if (char === '}' || char === ']') {
                        depth--;
                        if (depth === 0) {
                            lastValidEnd = i;
                        }
                    }
                }
                
                if (lastValidEnd > 0) {
                    jsonContent = trimmed.substring(0, lastValidEnd + 1);
                    data = JSON.parse(jsonContent);
                } else {
                    throw new Error('无法提取有效的 JSON 内容');
                }
            }
            
            // 重置懒加载状态
            jsonNodeIdCounter = 0;
            window.jsonLazyData = {};
            
            const html = buildJSONTree(data, '', true, 0);
            
            elements.previewContent.innerHTML = `
                <div class="json-preview">
                    <div class="json-tree">${html}</div>
                </div>
            `;

            // 绑定折叠事件
            bindJSONFoldEvents();

            // JSON 没有标题，隐藏目录
            hideTOC();
            
            // 格式化 JSON 并更新输入框
            // 对于大型 JSON（超过 500KB），跳过格式化以避免内存问题
            const MAX_FORMAT_SIZE = 500 * 1024; // 500KB
            if (content.length <= MAX_FORMAT_SIZE) {
                const formattedJSON = JSON.stringify(data, null, 2);
                if (elements.codeInput.value !== formattedJSON) {
                    // 保存当前光标位置
                    const scrollTop = elements.codeInput.scrollTop;
                    
                    // 更新内容
                    elements.codeInput.value = formattedJSON;
                    
                    // 更新字符计数
                    elements.charCount.textContent = `${formattedJSON.length} 字符`;
                    
                    // 恢复滚动位置
                    elements.codeInput.scrollTop = scrollTop;
                }
            } else {
                // 大型 JSON 只显示原始大小
                elements.charCount.textContent = `${content.length} 字符 (大文件，未格式化)`;
            }
            
            // 设置 JSON 滚动同步
            setupJSONScrollSync();

        } catch (error) {
            throw new Error(`JSON 解析错误: ${error.message}`);
        }
    }
    
    /**
     * 设置 JSON 预览和输入框的滚动同步
     */
    function setupJSONScrollSync() {
        // 移除旧的滚动监听器
        if (state.jsonScrollHandler) {
            elements.previewWrapper.removeEventListener('scroll', state.jsonScrollHandler);
            elements.codeInput.removeEventListener('scroll', state.inputScrollHandler);
        }
        
        // 标记是否正在同步滚动，防止循环触发
        let isSyncing = false;
        
        // 预览区滚动时同步输入框
        state.jsonScrollHandler = (e) => {
            if (isSyncing) return;
            isSyncing = true;
            
            const previewWrapper = elements.previewWrapper;
            const input = elements.codeInput;
            
            // 计算滚动比例
            const scrollRatio = previewWrapper.scrollTop / (previewWrapper.scrollHeight - previewWrapper.clientHeight || 1);
            
            // 应用到输入框
            input.scrollTop = scrollRatio * (input.scrollHeight - input.clientHeight);
            
            setTimeout(() => { isSyncing = false; }, 10);
        };
        
        // 输入框滚动时同步预览区
        state.inputScrollHandler = (e) => {
            if (isSyncing) return;
            isSyncing = true;
            
            const previewWrapper = elements.previewWrapper;
            const input = elements.codeInput;
            
            // 计算滚动比例
            const scrollRatio = input.scrollTop / (input.scrollHeight - input.clientHeight || 1);
            
            // 应用到预览区
            previewWrapper.scrollTop = scrollRatio * (previewWrapper.scrollHeight - previewWrapper.clientHeight);
            
            setTimeout(() => { isSyncing = false; }, 10);
        };
        
        // 绑定事件
        elements.previewWrapper.addEventListener('scroll', state.jsonScrollHandler);
        elements.codeInput.addEventListener('scroll', state.inputScrollHandler);
        
        // 标记当前是 JSON 模式
        state.isJSONMode = true;
    }
    
    /**
     * 移除 JSON 滚动同步
     */
    function removeJSONScrollSync() {
        if (state.jsonScrollHandler) {
            elements.previewWrapper.removeEventListener('scroll', state.jsonScrollHandler);
            state.jsonScrollHandler = null;
        }
        if (state.inputScrollHandler) {
            elements.codeInput.removeEventListener('scroll', state.inputScrollHandler);
            state.inputScrollHandler = null;
        }
        state.isJSONMode = false;
    }

    // JSON 懒加载配置
    const JSON_LAZY_CONFIG = {
        maxInitialDepth: 2,      // 初始展开的最大深度
        lazyLoadThreshold: 100,  // 子节点超过此数量时启用懒加载
        batchSize: 50            // 每次懒加载的批次大小
    };
    
    // 全局 JSON 数据存储（用于懒加载）
    let jsonDataStore = new WeakMap();
    let jsonNodeIdCounter = 0;

    /**
     * 递归构建 JSON 树形结构 HTML（带懒加载支持）
     * @param {any} data - JSON 数据
     * @param {string} key - 当前键名（空字符串表示根节点）
     * @param {boolean} isLast - 是否是父级的最后一个子元素
     * @param {number} depth - 当前深度
     * @returns {string} HTML 字符串
     */
    function buildJSONTree(data, key, isLast, depth = 0) {
        const type = getJSONType(data);
        const comma = isLast ? '' : '<span class="json-comma">,</span>';
        const keyHtml = key !== '' ? `<span class="json-key">"${escapeHtml(key)}"</span><span class="json-colon">: </span>` : '';
        
        // 生成唯一节点 ID
        const nodeId = `json-node-${jsonNodeIdCounter++}`;

        if (type === 'object') {
            const entries = Object.entries(data);
            if (entries.length === 0) {
                return `<div class="json-line">${keyHtml}<span class="json-brace">{}</span>${comma}</div>`;
            }
            
            // 判断是否需要懒加载
            const shouldLazyLoad = depth >= JSON_LAZY_CONFIG.maxInitialDepth || 
                                   entries.length > JSON_LAZY_CONFIG.lazyLoadThreshold;
            
            const isExpanded = !shouldLazyLoad;
            
            // 如果需要懒加载，存储数据
            if (shouldLazyLoad) {
                window.jsonLazyData[nodeId] = { data, key, isLast, depth };
            }
            
            const childrenHtml = shouldLazyLoad ? '' : entries.map(([k, v], index) => 
                buildJSONTree(v, k, index === entries.length - 1, depth + 1)
            ).join('');

            // 存储数据供懒加载使用
            const dataAttr = shouldLazyLoad ? `data-lazy="true" data-node-id="${nodeId}"` : '';

            return `
                <div class="json-node json-object" id="${nodeId}">
                    <div class="json-line json-collapsible" data-expanded="${isExpanded}" ${dataAttr} onclick="window.toggleJSONFold(this)">
                        <span class="json-fold-btn">
                            <svg class="json-fold-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </span>
                        ${keyHtml}<span class="json-brace">{</span>
                        <span class="json-preview-hint">${entries.length} ${entries.length === 1 ? 'property' : 'properties'}</span>
                    </div>
                    <div class="json-children" style="${shouldLazyLoad ? 'display:none' : ''}">${childrenHtml}</div>
                    <div class="json-line"><span class="json-brace">}</span>${comma}</div>
                </div>
            `;
        }

        if (type === 'array') {
            if (data.length === 0) {
                return `<div class="json-line">${keyHtml}<span class="json-bracket">[]</span>${comma}</div>`;
            }

            // 判断是否需要懒加载
            const shouldLazyLoad = depth >= JSON_LAZY_CONFIG.maxInitialDepth || 
                                   data.length > JSON_LAZY_CONFIG.lazyLoadThreshold;
            
            const isExpanded = !shouldLazyLoad;
            
            // 如果需要懒加载，存储数据
            if (shouldLazyLoad) {
                window.jsonLazyData[nodeId] = { data, key, isLast, depth };
            }
            
            const childrenHtml = shouldLazyLoad ? '' : data.map((item, index) => 
                buildJSONTree(item, '', index === data.length - 1, depth + 1)
            ).join('');

            // 存储数据供懒加载使用
            const dataAttr = shouldLazyLoad ? `data-lazy="true" data-node-id="${nodeId}"` : '';

            return `
                <div class="json-node json-array" id="${nodeId}">
                    <div class="json-line json-collapsible" data-expanded="${isExpanded}" ${dataAttr} onclick="window.toggleJSONFold(this)">
                        <span class="json-fold-btn">
                            <svg class="json-fold-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </span>
                        ${keyHtml}<span class="json-bracket">[</span>
                        <span class="json-preview-hint">${data.length} ${data.length === 1 ? 'item' : 'items'}</span>
                    </div>
                    <div class="json-children" style="${shouldLazyLoad ? 'display:none' : ''}">${childrenHtml}</div>
                    <div class="json-line"><span class="json-bracket">]</span>${comma}</div>
                </div>
            `;
        }

        // 基本类型 - 对于超长字符串进行截断显示
        let valueHtml = '';
        switch (type) {
            case 'string':
                const displayStr = data.length > 500 ? data.substring(0, 500) + '...' : data;
                const truncatedAttr = data.length > 500 ? ' data-truncated="true"' : '';
                valueHtml = `<span class="json-string"${truncatedAttr}>"${escapeHtml(displayStr)}"</span>`;
                break;
            case 'number':
                valueHtml = `<span class="json-number">${data}</span>`;
                break;
            case 'boolean':
                valueHtml = `<span class="json-boolean">${data}</span>`;
                break;
            case 'null':
                valueHtml = `<span class="json-null">null</span>`;
                break;
        }

        return `<div class="json-line">${keyHtml}${valueHtml}${comma}</div>`;
    }

    /**
     * 获取 JSON 值的类型
     */
    function getJSONType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    /**
     * 绑定 JSON 折叠事件（现在使用内联 onclick，此函数保留兼容性）
     */
    function bindJSONFoldEvents() {
        // 事件已通过内联 onclick 处理，无需额外绑定
    }
    
    
    /**
     * 懒加载子节点内容
     */
    function lazyLoadJSONChildren(lineEl, node, children) {
        const nodeId = lineEl.dataset.nodeId;
        const storedData = window.jsonLazyData?.[nodeId];
        
        if (!storedData) {
            console.warn('No lazy data found for node:', nodeId);
            return;
        }
        
        const { data, key, isLast, depth } = storedData;
        const type = getJSONType(data);
        
        // 分批渲染以避免阻塞
        if (type === 'object') {
            const entries = Object.entries(data);
            renderBatch(entries, children, depth, true);
        } else if (type === 'array') {
            renderBatch(data.map((item, i) => [i, item]), children, depth, false);
        }
        
        // 标记已加载
        lineEl.dataset.lazy = 'loaded';
    }
    
    /**
     * 分批渲染节点
     */
    function renderBatch(items, container, depth, isObject) {
        const batchSize = JSON_LAZY_CONFIG.batchSize;
        let currentIndex = 0;
        
        function renderNextBatch() {
            const fragment = document.createDocumentFragment();
            const end = Math.min(currentIndex + batchSize, items.length);
            
            for (let i = currentIndex; i < end; i++) {
                const [key, value] = items[i];
                const isLast = i === items.length - 1;
                const html = buildJSONTree(value, isObject ? key : '', isLast, depth + 1);
                
                const temp = document.createElement('div');
                temp.innerHTML = html;
                while (temp.firstChild) {
                    fragment.appendChild(temp.firstChild);
                }
            }
            
            container.appendChild(fragment);
            currentIndex = end;
            
            // 如果还有更多项，使用 requestIdleCallback 或 setTimeout 继续
            if (currentIndex < items.length) {
                if (window.requestIdleCallback) {
                    requestIdleCallback(renderNextBatch, { timeout: 100 });
                } else {
                    setTimeout(renderNextBatch, 0);
                }
            }
        }
        
        renderNextBatch();
    }

    /**
     * 切换 JSON 节点展开/折叠状态（暴露到全局以供内联 onclick 调用）
     */
    window.toggleJSONFold = function(lineEl) {
        const isExpanded = lineEl.dataset.expanded === 'true';
        const node = lineEl.closest('.json-node');
        // 使用 :scope 选择器确保只选中直接子元素
        const children = node.querySelector(':scope > .json-children');
        
        if (!children) return;
        
        if (isExpanded) {
            // 折叠
            lineEl.dataset.expanded = 'false';
            children.style.display = 'none';
            lineEl.classList.add('is-collapsed');
        } else {
            // 展开 - 检查是否需要懒加载
            if (lineEl.dataset.lazy === 'true') {
                lazyLoadJSONChildren(lineEl, node, children);
            }
            // 展开
            lineEl.dataset.expanded = 'true';
            children.style.display = 'block';
            lineEl.classList.remove('is-collapsed');
        }
    };

    // ========================================
    // 渲染 Markdown
    // ========================================
    async function renderMarkdown(content) {
        // 移除 JSON 滚动同步
        removeJSONScrollSync();
        
        // 重置标题 ID 计数器，避免重复渲染时 ID 累加
        resetHeadingIdCounter();
        
        // 使用 marked 解析 Markdown
        const html = marked.parse(content);

        elements.previewContent.innerHTML = `
            <div class="markdown-preview">
                ${html}
            </div>
        `;

        // 为所有标题添加 id 属性，支持锚点跳转
        const headings = elements.previewContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            // 如果标题还没有 id，则根据文本内容生成一个
            if (!heading.id) {
                const id = generateHeadingId(heading.textContent);
                heading.id = id;
            }
        });

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

        // 处理锚点链接点击，实现预览区内部滚动
        const links = elements.previewContent.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = decodeURIComponent(link.getAttribute('href').slice(1));
                const targetElement = elements.previewContent.querySelector(`#${CSS.escape(targetId)}`);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // 生成目录导航
        generateTOC();
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
        // 空状态时隐藏目录
        hideTOC();
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

        // 添加背景色（根据当前主题）
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        clonedSvg.style.backgroundColor = currentTheme === 'dark' ? '#0d1117' : '#ffffff';

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

        // 添加背景色（根据当前主题）
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const bgColor = currentTheme === 'dark' ? '#0d1117' : '#ffffff';
        clonedSvg.style.backgroundColor = bgColor;

        // 创建 canvas
        const scale = 2; // 高清导出
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = svgWidth * scale;
        canvas.height = svgHeight * scale;

        // 设置背景色（根据当前主题）
        ctx.fillStyle = bgColor;
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
    // 复制图片到剪贴板
    // ========================================
    async function copyToClipboard() {
        const svgElement = elements.previewContent.querySelector('svg');
        if (!svgElement) {
            showToast('没有可复制的图表', 'error');
            return;
        }

        try {
            // 克隆 SVG 以获取完整尺寸
            const clonedSvg = svgElement.cloneNode(true);

            // 获取 SVG 的实际尺寸
            let svgWidth, svgHeight;

            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.split(/\s+|,/);
                svgWidth = parseFloat(parts[2]);
                svgHeight = parseFloat(parts[3]);
            }

            if (!svgWidth || !svgHeight) {
                const widthAttr = svgElement.getAttribute('width');
                const heightAttr = svgElement.getAttribute('height');
                if (widthAttr && heightAttr) {
                    svgWidth = parseFloat(widthAttr);
                    svgHeight = parseFloat(heightAttr);
                }
            }

            if (!svgWidth || !svgHeight) {
                try {
                    const bbox = svgElement.getBBox();
                    svgWidth = bbox.width + bbox.x * 2;
                    svgHeight = bbox.height + bbox.y * 2;
                } catch (e) {
                    const rect = svgElement.getBoundingClientRect();
                    svgWidth = rect.width;
                    svgHeight = rect.height;
                }
            }

            svgWidth = Math.max(svgWidth, 100);
            svgHeight = Math.max(svgHeight, 100);

            clonedSvg.setAttribute('width', svgWidth);
            clonedSvg.setAttribute('height', svgHeight);

            // 背景色（根据当前主题）
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const bgColor = currentTheme === 'dark' ? '#0d1117' : '#ffffff';
            clonedSvg.style.backgroundColor = bgColor;

            // 创建 canvas
            const scale = 2;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = svgWidth * scale;
            canvas.height = svgHeight * scale;

            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const svgData = new XMLSerializer().serializeToString(clonedSvg);
            const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
            const imgSrc = `data:image/svg+xml;base64,${svgBase64}`;

            const img = new Image();
            img.onload = async () => {
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

                canvas.toBlob(async (blob) => {
                    try {
                        // 检查剪贴板 API 是否可用
                        if (!navigator.clipboard || !navigator.clipboard.write) {
                            throw new Error('浏览器不支持剪贴板 API');
                        }

                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        showToast('图片已复制到剪贴板', 'success');
                    } catch (err) {
                        console.error('复制到剪贴板失败:', err);
                        showToast('复制失败: ' + err.message, 'error');
                    }
                }, 'image/png');
            };
            img.onerror = () => {
                showToast('图片加载失败', 'error');
            };
            img.src = imgSrc;

        } catch (error) {
            console.error('复制到剪贴板失败:', error);
            showToast('复制失败: ' + error.message, 'error');
        }
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
        state.panOffset = { x: 0, y: 0 };
        applyZoom();
    }

    function applyZoom() {
        applyTransform();
        elements.zoomLevel.textContent = `${Math.round(state.currentZoom * 100)}%`;
    }

    // ========================================
    // 应用变换（缩放 + 平移）
    // ========================================
    function applyTransform() {
        const { currentZoom, panOffset } = state;
        elements.previewContent.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${currentZoom})`;
    }

    // ========================================
    // 预览区拖拽平移
    // ========================================
    function initPanning() {
        const wrapper = elements.previewWrapper;

        // 双击预览区切换全屏（作为 F 键的替代方案）
        wrapper.addEventListener('dblclick', (e) => {
            // 如果双击的是按钮等交互元素，不切换全屏
            if (e.target.closest('button, a, input')) return;
            toggleFullscreen();
        });

        // 鼠标按下开始拖拽
        wrapper.addEventListener('mousedown', (e) => {
            // 忽略右键和中键
            if (e.button !== 0) return;

            // 如果点击的是按钮等交互元素，不启动拖拽
            if (e.target.closest('button, a, input')) return;
            
            // 如果点击的是 JSON 折叠元素，不启动拖拽
            if (e.target.closest('.json-collapsible')) return;

            // 移除输入元素的焦点，以便快捷键能正常工作
            if (document.activeElement && document.activeElement !== document.body) {
                document.activeElement.blur();
            }

            state.isPanning = true;
            state.panStart = {
                x: e.clientX - state.panOffset.x,
                y: e.clientY - state.panOffset.y
            };

            wrapper.classList.add('panning');
            e.preventDefault();
        });

        // 鼠标移动时平移
        document.addEventListener('mousemove', (e) => {
            if (!state.isPanning) return;

            state.panOffset = {
                x: e.clientX - state.panStart.x,
                y: e.clientY - state.panStart.y
            };

            applyTransform();
        });

        // 鼠标释放结束拖拽
        document.addEventListener('mouseup', () => {
            if (state.isPanning) {
                state.isPanning = false;
                elements.previewWrapper.classList.remove('panning');
            }
        });

        // 鼠标离开窗口时也结束拖拽
        document.addEventListener('mouseleave', () => {
            if (state.isPanning) {
                state.isPanning = false;
                elements.previewWrapper.classList.remove('panning');
            }
        });

        // ========================================
        // 触摸事件支持
        // ========================================

        // 触摸开始
        wrapper.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                // 单指：开始拖拽
                state.isTouching = true;
                state.isPanning = true;
                state.panStart = {
                    x: e.touches[0].clientX - state.panOffset.x,
                    y: e.touches[0].clientY - state.panOffset.y
                };
                wrapper.classList.add('panning');
            } else if (e.touches.length === 2) {
                // 双指：开始缩放
                state.isTouching = true;
                state.touchStartDistance = getTouchDistance(e.touches);
                state.touchStartZoom = state.currentZoom;
                state.isPanning = false;
                wrapper.classList.remove('panning');
            }
            e.preventDefault();
        }, { passive: false });

        // 触摸移动
        wrapper.addEventListener('touchmove', (e) => {
            if (!state.isTouching) return;

            if (e.touches.length === 1 && state.isPanning) {
                // 单指拖拽
                state.panOffset = {
                    x: e.touches[0].clientX - state.panStart.x,
                    y: e.touches[0].clientY - state.panStart.y
                };
                applyTransform();
            } else if (e.touches.length === 2) {
                // 双指缩放
                const currentDistance = getTouchDistance(e.touches);
                const scale = currentDistance / state.touchStartDistance;
                let newZoom = state.touchStartZoom * scale;

                // 限制缩放范围
                newZoom = Math.max(CONFIG.ZOOM_MIN, Math.min(CONFIG.ZOOM_MAX, newZoom));

                state.currentZoom = newZoom;
                applyTransform();
                elements.zoomLevel.textContent = `${Math.round(state.currentZoom * 100)}%`;
            }
            e.preventDefault();
        }, { passive: false });

        // 触摸结束
        wrapper.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                state.isTouching = false;
                state.isPanning = false;
                wrapper.classList.remove('panning');
            } else if (e.touches.length === 1) {
                // 从双指变为单指，重新开始拖拽
                state.isPanning = true;
                state.panStart = {
                    x: e.touches[0].clientX - state.panOffset.x,
                    y: e.touches[0].clientY - state.panOffset.y
                };
                wrapper.classList.add('panning');
            }
        });

        // 触摸取消
        wrapper.addEventListener('touchcancel', () => {
            state.isTouching = false;
            state.isPanning = false;
            wrapper.classList.remove('panning');
        });
    }

    // ========================================
    // 触摸辅助函数
    // ========================================
    function getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // ========================================
    // 同步滚动功能
    // ========================================
    function initSyncScroll() {
        const codeInput = elements.codeInput;
        const previewWrapper = elements.previewWrapper;
        
        /**
         * 计算滚动比例
         * @param {HTMLElement} element - 滚动元素
         * @returns {number} 滚动比例 (0-1)
         */
        function getScrollRatio(element) {
            const maxScroll = element.scrollHeight - element.clientHeight;
            if (maxScroll <= 0) return 0;
            return element.scrollTop / maxScroll;
        }
        
        /**
         * 设置滚动位置
         * @param {HTMLElement} element - 目标元素
         * @param {number} ratio - 滚动比例 (0-1)
         */
        function setScrollByRatio(element, ratio) {
            const maxScroll = element.scrollHeight - element.clientHeight;
            if (maxScroll <= 0) return;
            element.scrollTop = ratio * maxScroll;
        }
        
        // 监听左侧输入框滚动 -> 同步到右侧预览区
        codeInput.addEventListener('scroll', () => {
            if (!state.syncScrollEnabled || state.isSyncScrolling) return;
            
            state.isSyncScrolling = true;
            const ratio = getScrollRatio(codeInput);
            setScrollByRatio(previewWrapper, ratio);
            
            // 延迟重置标志，避免快速滚动时的抖动
            requestAnimationFrame(() => {
                state.isSyncScrolling = false;
            });
        });
        
        // 监听右侧预览区滚动 -> 同步到左侧输入框
        previewWrapper.addEventListener('scroll', () => {
            if (!state.syncScrollEnabled || state.isSyncScrolling) return;
            
            state.isSyncScrolling = true;
            const ratio = getScrollRatio(previewWrapper);
            setScrollByRatio(codeInput, ratio);
            
            // 延迟重置标志，避免快速滚动时的抖动
            requestAnimationFrame(() => {
                state.isSyncScrolling = false;
            });
        });
    }

    // ========================================
    // 目录导航 (TOC)
    // ========================================

    /**
     * 初始化目录导航
     */
    function initTOC() {
        if (!elements.tocContainer) return;

        // 鼠标进入容器区域 - 显示面板
        elements.tocContainer.addEventListener('mouseenter', () => {
            // 清除隐藏定时器
            if (state.tocHideTimer) {
                clearTimeout(state.tocHideTimer);
                state.tocHideTimer = null;
            }
            showTOCPanel();
        });

        // 鼠标离开容器区域 - 延迟隐藏面板
        elements.tocContainer.addEventListener('mouseleave', () => {
            // 延迟 200ms 隐藏，防止误触
            state.tocHideTimer = setTimeout(() => {
                hideTOCPanel();
            }, 200);
        });
    }

    /**
     * 生成目录
     */
    function generateTOC() {
        if (!elements.tocContainer || !elements.tocList) return;

        // 获取所有标题元素
        const headings = elements.previewContent.querySelectorAll('h1, h2, h3, h4, h5, h6');

        // 没有标题则隐藏目录按钮
        if (headings.length === 0) {
            hideTOC();
            return;
        }

        // 生成目录项
        const tocItems = Array.from(headings).map(heading => ({
            level: parseInt(heading.tagName[1]),
            text: heading.textContent.trim(),
            id: heading.id
        }));

        // 渲染目录列表
        renderTOCList(tocItems);

        // 显示目录按钮
        showTOC();
    }

    /**
     * 渲染目录列表
     */
    function renderTOCList(items) {
        if (items.length === 0) {
            elements.tocList.innerHTML = '<div class="toc-empty">暂无目录</div>';
            return;
        }

        elements.tocList.innerHTML = items.map(item => `
            <button class="toc-item" data-level="${item.level}" data-target="${item.id}" title="${escapeHtml(item.text)}">
                ${escapeHtml(item.text)}
            </button>
        `).join('');

        // 绑定点击事件
        elements.tocList.querySelectorAll('.toc-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.dataset.target;
                scrollToHeading(targetId);
                // 点击后立即收起目录
                hideTOCPanel();
            });
        });
    }

    /**
     * 滚动到指定标题
     */
    function scrollToHeading(id) {
        if (!id) return;

        const targetElement = elements.previewContent.querySelector(`#${CSS.escape(id)}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * 显示目录按钮
     */
    function showTOC() {
        if (elements.tocContainer) {
            elements.tocContainer.classList.add('visible');
        }
    }

    /**
     * 隐藏目录按钮
     */
    function hideTOC() {
        if (elements.tocContainer) {
            elements.tocContainer.classList.remove('visible');
            hideTOCPanel();
        }
    }

    /**
     * 显示目录面板
     */
    function showTOCPanel() {
        if (elements.tocContainer) {
            elements.tocContainer.classList.add('open');
            // 展开时更新当前活动章节
            updateActiveHeading();
        }
    }

    /**
     * 更新当前活动的章节高亮
     */
    function updateActiveHeading() {
        if (!elements.tocList || !elements.previewWrapper) return;

        const headings = elements.previewContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) return;

        // 获取预览区的滚动位置
        const scrollTop = elements.previewWrapper.scrollTop;
        const offset = 60; // 偏移量，提前高亮

        // 找到当前可见的章节
        let currentHeading = null;
        for (const heading of headings) {
            if (heading.offsetTop - offset <= scrollTop) {
                currentHeading = heading;
            } else {
                break;
            }
        }

        // 如果没找到（在最顶部），使用第一个标题
        if (!currentHeading && headings.length > 0) {
            currentHeading = headings[0];
        }

        if (!currentHeading) return;

        // 移除所有高亮
        const tocItems = elements.tocList.querySelectorAll('.toc-item');
        tocItems.forEach(item => item.classList.remove('active'));

        // 高亮当前项
        const activeItem = elements.tocList.querySelector(`[data-target="${CSS.escape(currentHeading.id)}"]`);
        if (activeItem) {
            activeItem.classList.add('active');

            // 滚动目录列表使高亮项可见
            const tocListRect = elements.tocList.getBoundingClientRect();
            const itemRect = activeItem.getBoundingClientRect();

            if (itemRect.top < tocListRect.top || itemRect.bottom > tocListRect.bottom) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    /**
     * 隐藏目录面板
     */
    function hideTOCPanel() {
        if (elements.tocContainer) {
            elements.tocContainer.classList.remove('open');
        }
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
        // 更新历史数量
        elements.historyCount.textContent = state.history.length;

        if (state.history.length === 0) {
            elements.historyList.innerHTML = `
                <div class="history-empty">
                    <p>暂无历史记录</p>
                </div>
            `;
            return;
        }

        elements.historyList.innerHTML = state.history.map(item => {
            const isFavorited = state.favorites.some(f => f.content === item.content);
            const typeLabels = { mermaid: 'Mermaid', markdown: 'Markdown', json: 'JSON' };
            return `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item-header">
                    <span class="history-item-type ${item.type}">${typeLabels[item.type] || item.type}</span>
                    <span class="history-item-title editable" data-id="${item.id}" data-source="history" title="点击编辑标题">${item.title ? escapeHtml(item.title) : '<span class="title-placeholder">添加标题</span>'}</span>
                    <span class="history-item-time">${formatTime(item.timestamp)}</span>
                    <div class="history-item-actions">
                        <button class="history-item-favorite ${isFavorited ? 'favorited' : ''}" data-id="${item.id}" title="${isFavorited ? '已收藏' : '添加收藏'}">
                            <svg viewBox="0 0 24 24" fill="${isFavorited ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </button>
                        <button class="history-item-delete" data-id="${item.id}" title="删除">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="history-item-preview">${escapeHtml(item.preview)}</div>
            </div>
        `}).join('');

        // 绑定点击事件
        elements.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.history-item-delete') &&
                    !e.target.closest('.history-item-favorite') &&
                    !e.target.closest('.history-item-title.editable')) {
                    loadFromHistory(parseInt(item.dataset.id));
                }
            });
        });

        // 绑定标题编辑事件
        elements.historyList.querySelectorAll('.history-item-title.editable').forEach(titleEl => {
            titleEl.addEventListener('click', (e) => {
                e.stopPropagation();
                startInlineEdit(titleEl, 'history');
            });
        });

        // 绑定收藏事件
        elements.historyList.querySelectorAll('.history-item-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const isFavorited = btn.classList.contains('favorited');
                if (!isFavorited) {
                    showFavoriteModal(id);
                } else {
                    showToast('该内容已在收藏中', 'info');
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
        if (state.currentTab === 'favorites') {
            // 清空收藏
            if (state.favorites.length === 0) return;
            state.favorites = [];
            saveFavorites();
            renderFavorites();
            renderHistory(); // 更新历史列表中的收藏状态
            showToast('收藏已清空', 'info');
        } else {
            // 清空历史
            if (state.history.length === 0) return;
            state.history = [];
            saveHistory();
            renderHistory();
            showToast('历史记录已清空', 'info');
        }
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
    // 收藏管理
    // ========================================
    function loadFavorites() {
        try {
            const saved = localStorage.getItem(CONFIG.FAVORITES_KEY);
            if (saved) {
                state.favorites = JSON.parse(saved);
                renderFavorites();
            }
        } catch (e) {
            console.error('加载收藏失败:', e);
            state.favorites = [];
        }
    }

    function saveFavorites() {
        try {
            localStorage.setItem(CONFIG.FAVORITES_KEY, JSON.stringify(state.favorites));
        } catch (e) {
            console.error('保存收藏失败:', e);
        }
    }

    function renderFavorites() {
        // 更新收藏数量
        elements.favoritesCount.textContent = state.favorites.length;

        if (state.favorites.length === 0) {
            elements.favoritesList.innerHTML = `
                <div class="history-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <p>暂无收藏</p>
                    <p class="history-empty-hint">点击历史记录中的星形图标添加收藏</p>
                </div>
            `;
            return;
        }

        const typeLabels = { mermaid: 'Mermaid', markdown: 'Markdown', json: 'JSON' };
        elements.favoritesList.innerHTML = state.favorites.map(item => `
            <div class="history-item favorite-item" data-id="${item.id}">
                <div class="history-item-header">
                    <span class="history-item-type ${item.type}">${typeLabels[item.type] || item.type}</span>
                    <span class="history-item-title editable" data-id="${item.id}" data-source="favorites" title="点击编辑标题">${item.title ? escapeHtml(item.title) : '<span class="title-placeholder">添加标题</span>'}</span>
                    <span class="history-item-time">${formatTime(item.timestamp)}</span>
                    <div class="history-item-actions">
                        <button class="history-item-favorite favorited" data-id="${item.id}" title="取消收藏">
                            <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </button>
                        <button class="history-item-delete" data-id="${item.id}" title="删除">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="history-item-preview">${escapeHtml(item.preview)}</div>
            </div>
        `).join('');

        // 绑定点击事件
        elements.favoritesList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.history-item-delete') &&
                    !e.target.closest('.history-item-favorite') &&
                    !e.target.closest('.history-item-title.editable')) {
                    loadFromFavorites(parseInt(item.dataset.id));
                }
            });
        });

        // 绑定标题编辑事件
        elements.favoritesList.querySelectorAll('.history-item-title.editable').forEach(titleEl => {
            titleEl.addEventListener('click', (e) => {
                e.stopPropagation();
                startInlineEdit(titleEl, 'favorites');
            });
        });

        // 绑定取消收藏事件
        elements.favoritesList.querySelectorAll('.history-item-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showDeleteFavoriteModal(parseInt(btn.dataset.id));
            });
        });

        // 绑定删除事件
        elements.favoritesList.querySelectorAll('.history-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showDeleteFavoriteModal(parseInt(btn.dataset.id));
            });
        });
    }

    function loadFromFavorites(id) {
        const item = state.favorites.find(f => f.id === id);
        if (item) {
            elements.codeInput.value = item.content;
            handleInputChange();
            closeHistory();
            showToast('已加载收藏', 'info');
        }
    }

    // ========================================
    // 标题内联编辑
    // ========================================
    function startInlineEdit(titleEl, source) {
        const id = parseInt(titleEl.dataset.id);
        const item = source === 'history'
            ? state.history.find(h => h.id === id)
            : state.favorites.find(f => f.id === id);

        if (!item) return;

        const currentTitle = item.title || '';
        const originalContent = titleEl.innerHTML;

        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'title-inline-input';
        input.value = currentTitle;
        input.placeholder = '输入标题...';
        input.maxLength = 50;

        // 替换内容为输入框
        titleEl.innerHTML = '';
        titleEl.appendChild(input);
        titleEl.classList.add('editing');

        // 聚焦并全选
        input.focus();
        input.select();

        // 保存函数
        const saveTitle = () => {
            const newTitle = input.value.trim();
            titleEl.classList.remove('editing');

            item.title = newTitle;

            if (source === 'history') {
                saveHistory();
                // 同步更新收藏中相同内容的标题
                const favoriteItem = state.favorites.find(f => f.content === item.content);
                if (favoriteItem) {
                    favoriteItem.title = newTitle;
                    saveFavorites();
                }
                renderHistory();
                renderFavorites();
            } else {
                saveFavorites();
                // 同步更新历史记录中相同内容的标题
                const historyItem = state.history.find(h => h.content === item.content);
                if (historyItem) {
                    historyItem.title = newTitle;
                    saveHistory();
                }
                renderFavorites();
                renderHistory();
            }
        };

        // 取消函数
        const cancelEdit = () => {
            titleEl.classList.remove('editing');
            titleEl.innerHTML = originalContent;
        };

        // 绑定事件
        input.addEventListener('blur', saveTitle);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                input.removeEventListener('blur', saveTitle);
                cancelEdit();
            }
        });

        // 阻止点击事件冒泡
        input.addEventListener('click', (e) => e.stopPropagation());
    }

    function showFavoriteModal(historyId) {
        state.pendingFavoriteId = historyId;
        // 预填充历史记录的标题
        const historyItem = state.history.find(h => h.id === historyId);
        elements.favoriteTitle.value = historyItem?.title || '';
        elements.favoriteModal.classList.add('open');
        setTimeout(() => elements.favoriteTitle.focus(), 100);
    }

    function hideFavoriteModal() {
        elements.favoriteModal.classList.remove('open');
        state.pendingFavoriteId = null;
    }

    function confirmAddFavorite() {
        if (state.pendingFavoriteId === null) return;

        const historyItem = state.history.find(h => h.id === state.pendingFavoriteId);
        if (!historyItem) {
            hideFavoriteModal();
            showToast('找不到该记录', 'error');
            return;
        }

        // 检查是否已收藏
        if (state.favorites.some(f => f.content === historyItem.content)) {
            hideFavoriteModal();
            showToast('该内容已在收藏中', 'info');
            return;
        }

        // 检查收藏数量限制
        if (state.favorites.length >= CONFIG.MAX_FAVORITES) {
            hideFavoriteModal();
            showToast(`收藏数量已达上限（${CONFIG.MAX_FAVORITES}个）`, 'error');
            return;
        }

        const title = elements.favoriteTitle.value.trim();

        // 添加到收藏
        const favoriteItem = {
            id: Date.now(),
            content: historyItem.content,
            type: historyItem.type,
            title: title || '',
            timestamp: Date.now(),
            preview: historyItem.preview
        };

        state.favorites.unshift(favoriteItem);
        saveFavorites();

        // 同步更新历史记录的标题
        if (title) {
            historyItem.title = title;
            saveHistory();
        }

        renderFavorites();
        renderHistory(); // 更新历史列表中的收藏状态和标题

        hideFavoriteModal();

        // 切换到收藏标签页
        switchTab('favorites');

        // 显示收藏成功动画和提示
        showToast('已添加到收藏', 'success');

        // 高亮刚添加的收藏项
        setTimeout(() => {
            const newItem = elements.favoritesList.querySelector(`[data-id="${favoriteItem.id}"]`);
            if (newItem) {
                newItem.classList.add('favorite-highlight');
                setTimeout(() => newItem.classList.remove('favorite-highlight'), 1500);
            }
        }, 100);
    }

    function showDeleteFavoriteModal(id) {
        state.pendingDeleteFavoriteId = id;
        elements.deleteFavoriteModal.classList.add('open');
    }

    function hideDeleteFavoriteModal() {
        elements.deleteFavoriteModal.classList.remove('open');
        state.pendingDeleteFavoriteId = null;
    }

    function confirmDeleteFavorite() {
        if (state.pendingDeleteFavoriteId === null) return;

        state.favorites = state.favorites.filter(f => f.id !== state.pendingDeleteFavoriteId);
        saveFavorites();
        renderFavorites();
        renderHistory(); // 更新历史列表中的收藏状态

        hideDeleteFavoriteModal();
        showToast('已从收藏中移除', 'info');
    }

    // ========================================
    // 标签页切换
    // ========================================
    function switchTab(tab) {
        state.currentTab = tab;

        // 更新标签页按钮状态
        document.getElementById('tab-favorites').classList.toggle('active', tab === 'favorites');
        document.getElementById('tab-history').classList.toggle('active', tab === 'history');

        // 切换列表显示
        elements.favoritesList.classList.toggle('hidden', tab !== 'favorites');
        elements.historyList.classList.toggle('hidden', tab !== 'history');

        // 更新清空按钮文本
        const clearBtn = document.getElementById('btn-history-clear');
        if (tab === 'favorites') {
            clearBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                清空收藏
            `;
        } else {
            clearBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                清空历史
            `;
        }
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

    // ========================================
    // 帮助面板
    // ========================================
    function showHelpModal() {
        elements.helpModal.classList.add('open');
    }

    function hideHelpModal() {
        elements.helpModal.classList.remove('open');
    }

    // ========================================
    // 主题切换
    // ========================================
    function initTheme() {
        // 从 localStorage 读取保存的主题
        const savedTheme = localStorage.getItem('mermaid-viewer-theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // 检测系统主题偏好
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('mermaid-viewer-theme', newTheme);

        // 重新初始化 Mermaid 以应用新主题
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: getMermaidThemeVariables()
        });

        showToast(newTheme === 'dark' ? '已切换到暗黑模式' : '已切换到亮色模式', 'success');

        // 如果有图表，重新渲染以适应新主题
        if (elements.codeInput.value.trim()) {
            handleInputChange();
        }
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
    
    /**
     * 检查当前焦点是否在可编辑元素中
     * 用于判断是否应该触发快捷键，避免与正常输入冲突
     */
    function isInEditableElement() {
        const activeElement = document.activeElement;
        if (!activeElement) return false;
        
        // 检查是否是输入元素（INPUT、TEXTAREA）
        const tagName = activeElement.tagName.toUpperCase();
        if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
            return true;
        }
        
        // 检查是否是可编辑内容
        if (activeElement.isContentEditable) {
            return true;
        }
        
        return false;
    }
    
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
            } else if (elements.favoriteModal.classList.contains('open')) {
                hideFavoriteModal();
            } else if (elements.deleteFavoriteModal.classList.contains('open')) {
                hideDeleteFavoriteModal();
            } else {
                closeHistory();
                hideExitModal();
                hideHelpModal();
            }
        }

        // F: 切换全屏预览（仅当不在任何输入元素中时）
        if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (!isInEditableElement()) {
                e.preventDefault();
                e.stopPropagation(); // 阻止事件传播给浏览器插件
                toggleFullscreen();
                return;
            }
        }

        // ?: 显示帮助面板（仅当不在任何输入元素中时）
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
            if (!isInEditableElement()) {
                e.preventDefault();
                e.stopPropagation();
                showHelpModal();
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

