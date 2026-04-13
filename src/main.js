// 全局状态
let currentFileId = null;
let storageMode = 'browser'; // 'browser' 或 'local'
let currentMode = 'split'; // 'split' 或 'preview'
let isDarkMode = false;
let isTocVisible = false;
let searchState = { query: '', replace: '', count: 0, current: 0 };

// 初始化应用
function initApp() {
    initDarkMode();
    initEditor();
    initFileList();
    initEventListeners();
    loadDefaultContent();
}

// 初始化深色模式
function initDarkMode() {
    isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').className = 'fa-solid fa-sun text-yellow-400 text-base';
    }
}

// 初始化编辑器
function initEditor() {
    // 简化编辑器初始化，使用基本的 textarea 作为替代
    // 实际项目中应该使用静态导入或其他方式加载 CodeMirror
    const editorContainer = document.getElementById('editor-container');
    const textarea = document.createElement('textarea');
    textarea.className = 'w-full h-full p-4 font-mono text-sm bg-transparent text-gray-800 dark:text-gray-200 resize-none outline-none';
    textarea.placeholder = '在此输入 Markdown...';
    editorContainer.appendChild(textarea);
    
    // 模拟编辑器对象
    window.editor = {
        state: {
            doc: {
                toString: () => textarea.value,
                length: textarea.value.length,
                lines: textarea.value.split('\n').length
            },
            selection: {
                from: 0,
                to: 0
            }
        },
        dispatch: (update) => {
            if (update.changes) {
                textarea.value = update.changes.insert;
            }
        }
    };
    
    // 添加事件监听器
    textarea.addEventListener('input', () => {
        updatePreview();
        updateCharCount();
        saveFile();
    });
    
    loadDefaultContent();
}

// 初始化文件列表
function initFileList() {
    renderFileList();
}

// 初始化事件监听器
function initEventListeners() {
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl+B: 加粗
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            insertFormat('bold');
        }
        // Ctrl+I: 斜体
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            insertFormat('italic');
        }
        // Ctrl+K: 链接
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            insertFormat('link');
        }
        // Ctrl+E: 行内代码
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            insertFormat('inline-code');
        }
        // Ctrl+F: 搜索
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            toggleCustomSearch();
        }
    });

    // 窗口大小变化
    window.addEventListener('resize', () => {
        updateEditorHeight();
    });
}

// 加载默认内容
function loadDefaultContent() {
    const defaultContent = `# Fly Markdown 实时预览器

欢迎使用 Fly Markdown 实时预览器！这是一个功能强大的 Markdown 编辑器，支持实时预览、语法高亮、数学公式、图表等功能。

## 功能特点

- ✅ 实时预览
- ✅ 语法高亮
- ✅ 数学公式支持
- ✅ Mermaid 图表
- ✅ 任务列表
- ✅ 代码高亮
- ✅ 深色模式
- ✅ 文件管理
- ✅ 快照时光机

## 基本语法

### 标题

# 一级标题
## 二级标题
### 三级标题

### 文本格式

**加粗**、*斜体*、***粗斜体***、~~删除线~~、\`行内代码\`

### 列表

- 无序列表项 1
- 无序列表项 2
  - 嵌套列表项

1. 有序列表项 1
2. 有序列表项 2

### 任务列表

- [x] 已完成任务
- [ ] 未完成任务

### 链接和图片

[GitHub](https://github.com)

![Markdown](https://via.placeholder.com/200x100?text=Markdown)

### 代码块

\`\`\`javascript
console.log('Hello, Markdown!');
\`\`\`

### 数学公式

行内公式：$E = mc^2$

块级公式：

$$
\int_0^1 x^2 dx
$$

### Mermaid 图表

\`\`\`mermaid
graph TD
  A[开始] --> B[处理]
  B --> C[结束]
\`\`\`

## 快捷键

- **Ctrl+B**: 加粗
- **Ctrl+I**: 斜体
- **Ctrl+K**: 插入链接
- **Ctrl+E**: 行内代码
- **Ctrl+F**: 搜索与替换

开始使用吧！`;

    if (window.editor) {
        window.editor.dispatch({
            changes: {
                from: 0,
                to: window.editor.state.doc.length,
                insert: defaultContent
            }
        });
    }
}

// 更新预览
function updatePreview() {
    if (!window.editor) return;

    const markdown = window.editor.state.doc.toString();
    const previewEl = document.getElementById('preview');

    // 配置 marked
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-',
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false,
        smartypants: false
    });

    // 启用脚注
    marked.use(markedFootnote);

    // 渲染 Markdown
    let html = marked.parse(markdown);
    
    // 安全处理
    html = DOMPurify.sanitize(html);
    
    // 渲染数学公式
    html = renderMathInElement(html);
    
    // 渲染 Mermaid 图表
    html = renderMermaidInElement(html);
    
    // 渲染 ECharts 图表
    html = renderEChartsInElement(html);

    previewEl.innerHTML = html;

    // 更新目录
    updateTOC();

    // 处理任务列表
    handleTaskList();
}

// 渲染数学公式
function renderMathInElement(html) {
    // 简单的数学公式渲染处理
    return html;
}

// 渲染 Mermaid 图表
function renderMermaidInElement(html) {
    // 简单的 Mermaid 图表渲染处理
    return html;
}

// 渲染 ECharts 图表
function renderEChartsInElement(html) {
    // 简单的 ECharts 图表渲染处理
    return html;
}

// 更新目录
function updateTOC() {
    const previewEl = document.getElementById('preview');
    const tocListEl = document.getElementById('toc-list');
    const headings = previewEl.querySelectorAll('h1, h2, h3, h4, h5, h6');

    let tocHTML = '';
    headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        const level = parseInt(heading.tagName.substring(1));
        const indent = (level - 1) * 16;
        tocHTML += `<div style="margin-left: ${indent}px;" class="toc-item">
            <a href="#${id}" class="block py-1 px-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                ${heading.textContent}
            </a>
        </div>`;
    });

    tocListEl.innerHTML = tocHTML;
}

// 处理任务列表
function handleTaskList() {
    const previewEl = document.getElementById('preview');
    const checkboxes = previewEl.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // 这里可以添加任务列表状态更新逻辑
        });
    });
}

// 更新字符计数
function updateCharCount() {
    if (!window.editor) return;

    const doc = window.editor.state.doc;
    const lines = doc.lines;
    const chars = doc.length;
    document.getElementById('char-count').textContent = `${lines} 行 | ${chars} 字符`;
}

// 保存文件
function saveFile() {
    if (!window.editor || !currentFileId) return;

    const content = window.editor.state.doc.toString();
    if (storageMode === 'browser') {
        const files = JSON.parse(localStorage.getItem('markdownFiles') || '{}');
        files[currentFileId] = {
            content,
            lastModified: new Date().toISOString()
        };
        localStorage.setItem('markdownFiles', JSON.stringify(files));
    }
    // 本地存储模式的处理

    // 更新保存状态
    const saveStatus = document.getElementById('save-status');
    saveStatus.textContent = '已保存';
    setTimeout(() => {
        saveStatus.textContent = '已保存';
    }, 1000);
}

// 渲染文件列表
function renderFileList() {
    const fileListEl = document.getElementById('file-list');
    const searchInput = document.getElementById('file-search-input').value.toLowerCase();

    let files = {};
    if (storageMode === 'browser') {
        files = JSON.parse(localStorage.getItem('markdownFiles') || '{}');
    }
    // 本地存储模式的处理

    let fileHTML = '';
    Object.entries(files).forEach(([id, file]) => {
        const fileName = id;
        if (searchInput && !fileName.toLowerCase().includes(searchInput)) {
            return;
        }

        fileHTML += `<div class="file-item px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded cursor-pointer flex items-center justify-between" data-file-id="${id}" onclick="openFile('${id}')">
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-file-lines text-blue-500"></i>
                <span class="file-item-name">${fileName}</span>
            </div>
            <div class="flex items-center gap-1">
                <button onclick="event.stopPropagation(); renameFile('${id}')" class="text-gray-400 hover:text-blue-500 transition" title="重命名"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="event.stopPropagation(); deleteFile('${id}')" class="text-gray-400 hover:text-red-500 transition" title="删除"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    });

    if (Object.keys(files).length === 0) {
        fileHTML = `<div class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
            <i class="fa-solid fa-folder-open text-4xl mb-3"></i>
            <p>暂无文件</p>
            <p class="text-xs mt-1">点击右上角 "新建文件" 开始</p>
        </div>`;
    }

    fileListEl.innerHTML = fileHTML;
}

// 打开文件
function openFile(fileId) {
    currentFileId = fileId;
    document.getElementById('current-filename-display').innerHTML = `<i class="fa-solid fa-code text-blue-500 mr-1.5"></i>${fileId}`;

    let files = {};
    if (storageMode === 'browser') {
        files = JSON.parse(localStorage.getItem('markdownFiles') || '{}');
    }
    // 本地存储模式的处理

    if (files[fileId]) {
        if (window.editor) {
            window.editor.dispatch({
                changes: {
                    from: 0,
                    to: window.editor.state.doc.length,
                    insert: files[fileId].content
                }
            });
        }
    }
}

// 创建新文件
function reqCreateNewFile(parentId) {
    const fileName = prompt('请输入文件名：');
    if (!fileName) return;

    if (storageMode === 'browser') {
        const files = JSON.parse(localStorage.getItem('markdownFiles') || '{}');
        if (files[fileName]) {
            alert('文件名已存在');
            return;
        }
        files[fileName] = {
            content: '',
            lastModified: new Date().toISOString()
        };
        localStorage.setItem('markdownFiles', JSON.stringify(files));
    }
    // 本地存储模式的处理

    renderFileList();
    openFile(fileName);
}

// 创建新文件夹
function reqCreateNewFolder(parentId) {
    const folderName = prompt('请输入文件夹名：');
    if (!folderName) return;

    // 文件夹创建逻辑
    alert('文件夹功能开发中');
}

// 重命名文件
function renameFile(fileId) {
    const newName = prompt('请输入新文件名：', fileId);
    if (!newName || newName === fileId) return;

    if (storageMode === 'browser') {
        const files = JSON.parse(localStorage.getItem('markdownFiles') || '{}');
        if (files[newName]) {
            alert('文件名已存在');
            return;
        }
        files[newName] = files[fileId];
        delete files[fileId];
        localStorage.setItem('markdownFiles', JSON.stringify(files));
    }
    // 本地存储模式的处理

    if (currentFileId === fileId) {
        currentFileId = newName;
        document.getElementById('current-filename-display').innerHTML = `<i class="fa-solid fa-code text-blue-500 mr-1.5"></i>${newName}`;
    }

    renderFileList();
}

// 删除文件
function deleteFile(fileId) {
    if (!confirm('确定要删除这个文件吗？')) return;

    if (storageMode === 'browser') {
        const files = JSON.parse(localStorage.getItem('markdownFiles') || '{}');
        delete files[fileId];
        localStorage.setItem('markdownFiles', JSON.stringify(files));
    }
    // 本地存储模式的处理

    if (currentFileId === fileId) {
        currentFileId = null;
        document.getElementById('current-filename-display').innerHTML = '<i class="fa-solid fa-code text-blue-500 mr-1.5"></i>编辑器';
        if (window.editor) {
            window.editor.dispatch({
                changes: {
                    from: 0,
                    to: window.editor.state.doc.length,
                    insert: ''
                }
            });
        }
    }

    renderFileList();
}

// 设置存储模式
function setStorageMode(mode) {
    storageMode = mode;
    document.getElementById('btn-mode-browser').className = mode === 'browser' ? 'flex-1 py-1.5 text-xs rounded-md bg-blue-100 text-blue-700 dark:bg-slate-700 dark:text-blue-400 font-bold transition shadow-sm border border-blue-200 dark:border-slate-600' : 'flex-1 py-1.5 text-xs rounded-md text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-800 transition border border-transparent hover:border-gray-300 dark:hover:border-slate-600';
    document.getElementById('btn-mode-local').className = mode === 'local' ? 'flex-1 py-1.5 text-xs rounded-md bg-blue-100 text-blue-700 dark:bg-slate-700 dark:text-blue-400 font-bold transition shadow-sm border border-blue-200 dark:border-slate-600' : 'flex-1 py-1.5 text-xs rounded-md text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-800 transition border border-transparent hover:border-gray-300 dark:hover:border-slate-600';
    renderFileList();
}

// 设置模式（分屏或预览）
function setMode(mode) {
    currentMode = mode;
    const mainWorkspace = document.getElementById('main-workspace');
    const btnSplit = document.getElementById('btn-split');
    const btnPreview = document.getElementById('btn-preview');

    if (mode === 'split') {
        mainWorkspace.classList.remove('is-preview-mode');
        btnSplit.className = 'px-4 py-1.5 rounded bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 transition-all flex items-center gap-1.5 text-sm font-medium';
        btnPreview.className = 'px-4 py-1.5 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 text-sm font-medium';
    } else {
        mainWorkspace.classList.add('is-preview-mode');
        btnSplit.className = 'px-4 py-1.5 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 text-sm font-medium';
        btnPreview.className = 'px-4 py-1.5 rounded bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 transition-all flex items-center gap-1.5 text-sm font-medium';
    }
}

// 切换深色模式
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);

    const themeIcon = document.getElementById('theme-icon');
    if (isDarkMode) {
        themeIcon.className = 'fa-solid fa-sun text-yellow-400 text-base';
    } else {
        themeIcon.className = 'fa-solid fa-moon text-indigo-500 dark:text-yellow-400 text-base';
    }

    // 更新编辑器主题
    if (window.editor) {
        // 这里可以添加编辑器主题更新逻辑
    }
}

// 切换目录
function toggleTOC() {
    isTocVisible = !isTocVisible;
    const tocPane = document.getElementById('toc-pane');
    const tocResizer = document.getElementById('toc-resizer');

    if (isTocVisible) {
        tocPane.classList.remove('hidden');
        tocResizer.classList.remove('hidden');
    } else {
        tocPane.classList.add('hidden');
        tocResizer.classList.add('hidden');
    }
}

// 切换全屏
function toggleFullScreen() {
    const appContainer = document.getElementById('app-container');
    if (!document.fullscreenElement) {
        appContainer.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// 折叠文件侧边栏
function collapseFileSidebar() {
    document.getElementById('file-sidebar').classList.add('hidden');
    document.getElementById('file-sidebar-collapsed').classList.remove('hidden');
}

// 展开文件侧边栏
function expandFileSidebar() {
    document.getElementById('file-sidebar').classList.remove('hidden');
    document.getElementById('file-sidebar-collapsed').classList.add('hidden');
}

// 切换搜索面板
function toggleCustomSearch() {
    const searchPanel = document.getElementById('custom-search-panel');
    searchPanel.classList.toggle('hidden');
    if (!searchPanel.classList.contains('hidden')) {
        document.getElementById('find-input').focus();
    }
}

// 关闭搜索面板
function closeCustomSearch() {
    document.getElementById('custom-search-panel').classList.add('hidden');
}

// 切换替换行
function toggleReplaceRow() {
    const replaceRow = document.getElementById('replace-row');
    const searchExpandIcon = document.getElementById('search-expand-icon');
    replaceRow.classList.toggle('hidden');
    searchExpandIcon.style.transform = replaceRow.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(90deg)';
}

// 更新搜索查询
function updateSearchQuery() {
    const findInput = document.getElementById('find-input');
    const replaceInput = document.getElementById('replace-input');
    searchState.query = findInput.value;
    searchState.replace = replaceInput.value;
    // 这里可以添加搜索逻辑
}

// 执行搜索
function execSearch(direction) {
    // 搜索逻辑
}

// 执行替换
function execReplace(type) {
    // 替换逻辑
}

// 插入格式
function insertFormat(type) {
    if (!window.editor) return;

    const selection = window.editor.state.selection;
    const selectedText = window.editor.state.doc.sliceString(selection.from, selection.to);
    let insertedText = '';

    switch (type) {
        case 'bold':
            insertedText = `**${selectedText}**`;
            break;
        case 'italic':
            insertedText = `*${selectedText}*`;
            break;
        case 'underline':
            insertedText = `<u>${selectedText}</u>`;
            break;
        case 'strike':
            insertedText = `~~${selectedText}~~`;
            break;
        case 'mark':
            insertedText = `<mark>${selectedText}</mark>`;
            break;
        case 'inline-code':
            insertedText = `\`${selectedText}\``;
            break;
        case 'h1':
            insertedText = `# ${selectedText}`;
            break;
        case 'h2':
            insertedText = `## ${selectedText}`;
            break;
        case 'h3':
            insertedText = `### ${selectedText}`;
            break;
        case 'h4':
            insertedText = `#### ${selectedText}`;
            break;
        case 'ul':
            insertedText = `- ${selectedText}`;
            break;
        case 'ol':
            insertedText = `1. ${selectedText}`;
            break;
        case 'task':
            insertedText = `- [ ] ${selectedText}`;
            break;
        case 'quote':
            insertedText = `> ${selectedText}`;
            break;
        case 'code-block':
            insertedText = `\`\`\`javascript\n${selectedText}\n\`\`\``;
            break;
        case 'table':
            insertedText = `| 表头1 | 表头2 |\n| --- | --- |\n| 内容1 | 内容2 |`;
            break;
        case 'details':
            insertedText = `<details>\n<summary>标题</summary>\n${selectedText}\n</details>`;
            break;
        case 'math-inline':
            insertedText = `$${selectedText}$`;
            break;
        case 'math-block':
            insertedText = `$$\n${selectedText}\n$$`;
            break;
        case 'mermaid':
            insertedText = `\`\`\`mermaid\ngraph TD\n  A[开始] --> B[处理]\n  B --> C[结束]\n\`\`\``;
            break;
        case 'link':
            insertedText = `[${selectedText || '链接文本'}](https://example.com)`;
            break;
        case 'image':
            insertedText = `![${selectedText || '图片描述'}](https://via.placeholder.com/300)`;
            break;
        case 'hr':
            insertedText = `---`;
            break;
    }

    window.editor.dispatch({
        changes: {
            from: selection.from,
            to: selection.to,
            insert: insertedText
        },
        selection: {
            anchor: selection.from + insertedText.length
        }
    });
}

// 处理文件上传
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        if (window.editor) {
            window.editor.dispatch({
                changes: {
                    from: 0,
                    to: window.editor.state.doc.length,
                    insert: content
                }
            });
        }
    };
    reader.readAsText(file);

    // 重置文件输入
    event.target.value = '';
}

// 粘贴内容
function pasteContent() {
    navigator.clipboard.readText().then(text => {
        if (window.editor) {
            const selection = window.editor.state.selection;
            window.editor.dispatch({
                changes: {
                    from: selection.from,
                    to: selection.to,
                    insert: text
                }
            });
        }
    });
}

// 清空编辑器
function reqClearEditor() {
    if (confirm('确定要清空编辑器吗？')) {
        if (window.editor) {
            window.editor.dispatch({
                changes: {
                    from: 0,
                    to: window.editor.state.doc.length,
                    insert: ''
                }
            });
        }
    }
}

// 重置编辑器
function reqResetEditor() {
    loadDefaultContent();
}

// 下载 MD 文件
function downloadMD() {
    if (!window.editor) return;

    const content = window.editor.state.doc.toString();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileId || 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 复制 MD 内容
function copyMD() {
    if (!window.editor) return;

    const content = window.editor.state.doc.toString();
    navigator.clipboard.writeText(content).then(() => {
        alert('内容已复制到剪贴板');
    });
}

// 导出 PDF
function exportPDF() {
    alert('PDF 导出功能开发中');
}

// 导出 Word
function exportWord() {
    alert('Word 导出功能开发中');
}

// 导出图片
function exportImage() {
    alert('图片导出功能开发中');
}

// 导出 HTML
function exportHTML() {
    if (!window.editor) return;

    const content = window.editor.state.doc.toString();
    const html = marked.parse(content);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileId ? currentFileId.replace('.md', '.html') : 'document.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 打开转换器模态框
function openConverterModal() {
    if (!window.editor) return;

    const content = window.editor.state.doc.toString();
    document.getElementById('modal-md-input').value = content;
    document.getElementById('converter-modal').classList.remove('hidden');
    updateModalOutputs();
}

// 关闭转换器模态框
function closeConverterModal() {
    document.getElementById('converter-modal').classList.add('hidden');
}

// 更新模态框输出
function updateModalOutputs() {
    const content = document.getElementById('modal-md-input').value;
    const plainOutput = document.getElementById('output-plain');
    const richOutput = document.getElementById('output-rich');
    const htmlOutput = document.getElementById('output-html');

    // 纯文本输出
    plainOutput.value = content;

    // 富文本输出
    const html = marked.parse(content);
    richOutput.innerHTML = DOMPurify.sanitize(html);

    // HTML 源码输出
    htmlOutput.value = html;
}

// 切换标签
function switchTab(tabId) {
    const tabs = ['tab-plain', 'tab-rich', 'tab-html'];
    const buttons = ['btn-tab-plain', 'btn-tab-rich', 'btn-tab-html'];

    tabs.forEach(tab => {
        document.getElementById(tab).classList.add('hidden');
    });

    buttons.forEach(btn => {
        document.getElementById(btn).className = 'pb-2 px-2 border-b-2 border-transparent text-gray-500 font-medium whitespace-nowrap';
    });

    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById(`btn-${tabId}`).className = 'pb-2 px-2 border-b-2 border-blue-600 text-blue-600 font-medium whitespace-nowrap';
}

// 复制当前标签内容
function copyCurrentTabContent() {
    let content = '';
    if (!document.getElementById('tab-plain').classList.contains('hidden')) {
        content = document.getElementById('output-plain').value;
    } else if (!document.getElementById('tab-rich').classList.contains('hidden')) {
        content = document.getElementById('output-rich').innerHTML;
    } else if (!document.getElementById('tab-html').classList.contains('hidden')) {
        content = document.getElementById('output-html').value;
    }

    navigator.clipboard.writeText(content).then(() => {
        alert('内容已复制到剪贴板');
    });
}

// 打开历史模态框
function openHistoryModal() {
    document.getElementById('history-modal').classList.remove('hidden');
    renderHistoryListModal();
}

// 关闭历史模态框
function closeHistoryModal() {
    document.getElementById('history-modal').classList.add('hidden');
}

// 渲染历史列表
function renderHistoryListModal() {
    const historyList = document.getElementById('history-list');
    // 这里可以添加历史记录渲染逻辑
    historyList.innerHTML = '<div class="p-4 text-center text-gray-500 dark:text-gray-400">时光机功能开发中</div>';
}

// 手动快照
function manualSnapshot() {
    // 这里可以添加手动快照逻辑
    alert('快照功能开发中');
}

// 打开帮助模态框
function openHelpModal() {
    alert('帮助文档开发中');
}

// 更新编辑器高度
function updateEditorHeight() {
    // 这里可以添加编辑器高度更新逻辑
}

// 页面加载完成后初始化应用
window.addEventListener('DOMContentLoaded', initApp);
