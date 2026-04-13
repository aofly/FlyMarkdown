import { EditorState, Compartment, EditorSelection } from "@codemirror/state";
import { EditorView, keymap, drawSelection, highlightSpecialChars, highlightActiveLine, dropCursor, rectangularSelection, crosshairCursor, lineNumbers, highlightActiveLineGutter, Decoration, ViewPlugin, WidgetType, MatchDecorator } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { search, SearchQuery, setSearchQuery, findNext, findPrevious, replaceNext, replaceAll, highlightSelectionMatches } from "@codemirror/search";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { defaultHighlightStyle, syntaxHighlighting, bracketMatching, HighlightStyle, foldGutter } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { tags as t } from "@lezer/highlight";

const defaultMarkdown = `# 欢迎体验 Fly Markdown 🚀

这是一份示例文档，用于展示编辑器的各项基础与排版功能。您可以随意修改或清空此文档开始写作。

---

## 📝 1. 基础排版与格式

支持标准 Markdown 语法及实用扩展：
**加粗文本**、*斜体文本*、~~删除线~~，以及 ==高亮标记== 和 <u>下划线</u>。

### 任务列表与待办
- [x] 晨间阅读 30 分钟
- [x] 整理昨日会议记录
- [ ] 制定下周工作计划

## 💻 2. 代码与高亮

支持百余种主流语言的语法高亮，自动识别代码结构：

\`\`\`javascript
function calculateSum(a, b) {
    return a + b;
}
console.log(calculateSum(10, 20));
\`\`\`

## 🧮 3. 数学公式

完美支持复杂的 LaTeX 数学公式渲染。
行内公式例如质能等价公式：$E=mc^2$。

块级公式支持：
$$
f(x) = \\int_{-\\infty}^\\infty \\hat f(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi
$$

## 📊 4. 图表与可视化

### 流程图 (Mermaid)
直接在 Markdown 中快速绘制流程图：

\`\`\`mermaid
graph LR
    A[开始写作] --> B(实时预览)
    B --> C{是否满意?}
    C -->|是| D[导出文档]
    C -->|否| B
\`\`\`

### 数据图表 (ECharts)
通过严格的 JSON 格式配置项直接渲染交互式数据图表：

\`\`\`echarts
{
  "title": { "text": "一周访问量" },
  "tooltip": {},
  "xAxis": { "data": ["周一", "周二", "周三", "周四", "周五"] },
  "yAxis": {},
  "series": [{ "type": "bar", "data": [120, 200, 150, 80, 70], "itemStyle": { "color": "#3b82f6" } }]
}
\`\`\`

## 📦 5. 增强互动组件

我们提供了一些美观的交互式排版组件：

<details class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-lg shadow-sm my-4">
<summary class="font-bold cursor-pointer outline-none select-none text-blue-600 dark:text-blue-400">💡 点击体验：折叠内容块</summary>

这是一个折叠块，非常适合用来隐藏长篇代码、参考资料或剧透内容。
支持在内部进行**嵌套排版**或插入表格！

| 功能 | 状态 | 备注 |
| :--- | :---: | :--- |
| 实时渲染 | ✅ | 毫秒级同步 |
| 本地存储 | ✅ | 数据防丢失 |
| 多端适配 | ✅ | 响应式设计 |

</details>

## 🖼️ 6. 媒体与链接

您可以方便地插入链接和图片：
![风景图片](https://picsum.photos/800/300)

---
*注：您可以在工具栏点击“重置文档”随时恢复此示例。支持脚注解析 [^1]。*

[^1]: 这是一个脚注示例，点击页面内的链接可以在正文和脚注之间平滑相互跳转。`;

const previewContainer = document.getElementById('preview-container');
const preview = document.getElementById('preview');
const THEME_KEY = 'fly_md_theme';
const FILES_DB_KEY = 'fly_md_files_v4';
const HISTORY_KEY = 'fly_md_history_v4';
const MAX_HISTORY = 15;

window.cmView = null;
window.openSearchPanel = () => { if(window.cmView) openSearchPanel(window.cmView); };

window.isUnsaved = false;
let saveTimeout;
let lastSaveTime = Date.now();
let selectedHistoryContent = null;
let previewRenderTimeout;
let isTOCScrolling = false; 

let currentStorageMode = localStorage.getItem('fly_storage_mode') || 'browser';
let browserFiles = []; 
let localFiles = []; 
let activeFileId = null;
let rootDirHandle = null;

window._activeEcharts = [];
window._activeObservers = [];

function cleanupEcharts() {
    if (window._activeObservers) {
        window._activeObservers.forEach(obs => obs.disconnect());
        window._activeObservers = [];
    }
    if (window._activeEcharts) {
        window._activeEcharts.forEach(chart => {
            if (chart && !chart.isDisposed()) chart.dispose();
        });
        window._activeEcharts = [];
    }
}

class FoldWidget extends WidgetType {
    constructor(match) { super(); this.match = match; }
    eq(other) { return this.match === other.match; }
    toDOM() {
        let wrap = document.createElement("span");
        wrap.innerHTML = '<i class="fa-solid fa-image"></i> [Base64 已折叠]';
        wrap.className = "bg-blue-100 text-blue-600 dark:bg-slate-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs cursor-pointer select-none inline-flex items-center gap-1 mx-1 shadow-sm border border-blue-200 dark:border-slate-600";
        wrap.title = "已自动折叠超长的 Base64 源码以提升编辑器性能";
        return wrap;
    }
    ignoreEvent() { return true; }
}
const base64Matcher = new MatchDecorator({
    regexp: /data:image\/[a-zA-Z0-9+-\.]+;base64,[A-Za-z0-9+/=]+/g,
    decoration: match => Decoration.replace({ widget: new FoldWidget(match[0]) })
});
const base64FoldPlugin = ViewPlugin.fromClass(class {
    constructor(view) { this.decorations = base64Matcher.createDeco(view); }
    update(update) { this.decorations = base64Matcher.updateDeco(update, this.decorations); }
}, {
    decorations: v => v.decorations,
    provide: plugin => EditorView.atomicRanges.of(view => {
        return view.plugin(plugin)?.decorations || Decoration.none
    })
});

const themeConfig = new Compartment();
const customLightHighlight = HighlightStyle.define([
    { tag: t.link, color: "#059669", textDecoration: "underline" },
    { tag: t.url, color: "#6b7280" },
    { tag: t.list, color: "#d97706" },
    { tag: t.quote, color: "#6b7280", fontStyle: "italic" },
    { tag: t.comment, color: "#9ca3af", fontStyle: "italic" },
    { tag: t.string, color: "#059669" },
    { tag: t.keyword, color: "#c026d3" },
    { tag: t.variableName, color: "#ea580c" },
    { tag: t.number, color: "#0284c7" }
]);

const markdownStyles = HighlightStyle.define([
    { tag: t.heading1, fontSize: "1.6em", fontWeight: "bold", color: "#2563eb" },
    { tag: t.heading2, fontSize: "1.4em", fontWeight: "bold", color: "#2563eb" },
    { tag: t.heading3, fontSize: "1.2em", fontWeight: "bold", color: "#2563eb" },
    { tag: t.heading4, fontSize: "1.1em", fontWeight: "bold", color: "#2563eb" },
    { tag: t.heading5, fontSize: "1.0em", fontWeight: "bold", color: "#2563eb" },
    { tag: t.heading6, fontSize: "0.9em", fontWeight: "bold", color: "#2563eb" },
    { tag: t.strong, fontWeight: "bold", color: "#b91c1c" },
    { tag: t.emphasis, fontStyle: "italic", color: "#047857" },
    { tag: t.strikethrough, textDecoration: "line-through" }
]);

const listContinueCommand = ({state, dispatch}) => {
    let handled = false;
    const changes = state.changeByRange(range => {
        if (!range.empty) return { range }; 
        const line = state.doc.lineAt(range.from);
        const match = line.text.match(/^(\s*)([-*+]|\d+\.)(\s+\[[ x]\])?\s+(.*)$/i);
        
        if (!match) {
            const emptyMatch = line.text.match(/^(\s*)([-*+]|\d+\.)(\s+\[[ x]\])?\s*$/);
            if (emptyMatch) {
                handled = true;
                return {
                    changes: {from: line.from, to: line.to, insert: ""},
                    range: EditorSelection.cursor(line.from)
                };
            }
            return { range };
        }
        
        handled = true;
        const indent = match[1];
        const bullet = match[2];
        const task = match[3] ? " [ ] " : " ";
        let nextBullet = bullet;
        if (/(\d+)\./.test(bullet)) {
            nextBullet = (parseInt(bullet) + 1) + ".";
        }
        const insertText = `\n${indent}${nextBullet}${task}`;
        return {
            changes: {from: range.from, to: range.to, insert: insertText},
            range: EditorSelection.cursor(range.from + insertText.length)
        };
    });
    if (handled) { dispatch(changes); return true; }
    return false;
};

window.reqConfirm = reqConfirm;
window.reqPrompt = reqPrompt;
window.setStorageMode = setStorageMode;
window.reqCreateNewFile = reqCreateNewFile;
window.reqCreateNewFolder = reqCreateNewFolder;
window.collapseFileSidebar = collapseFileSidebar;
window.expandFileSidebar = expandFileSidebar;
window.renderFileList = renderFileList;
window.switchFile = switchFile;
window.toggleDirectoryExpand = toggleDirectoryExpand;
window.showContextMenu = showContextMenu;
window.handleFileUpload = handleFileUpload;
window.pasteContent = pasteContent;
window.reqClearEditor = reqClearEditor;
window.reqResetEditor = reqResetEditor;
window.openHistoryModal = openHistoryModal;
window.closeHistoryModal = closeHistoryModal;
window.manualSnapshot = manualSnapshot;
window.renderHistoryListModal = renderHistoryListModal;
window.downloadMD = downloadMD;
window.copyMD = copyMD;
window.setMode = setMode;
window.toggleTOC = toggleTOC;
window.toggleDarkMode = toggleDarkMode;
window.toggleFullScreen = toggleFullScreen;
window.openConverterModal = openConverterModal;
window.closeConverterModal = closeConverterModal;
window.switchTab = switchTab;
window.updateModalOutputs = updateModalOutputs;
window.exportPDF = exportPDF;
window.exportWord = exportWord;
window.exportImage = exportImage;
window.exportHTML = exportHTML;
window.insertFormat = insertFormat;
window.openHelpModal = openHelpModal;
window.closeHelpModal = closeHelpModal;
window.copyCurrentTabContent = copyCurrentTabContent;

window.toggleCustomSearch = toggleCustomSearch;
window.closeCustomSearch = closeCustomSearch;
window.toggleReplaceRow = toggleReplaceRow;
window.updateSearchQuery = updateSearchQuery;
window.execSearch = execSearch;
window.execReplace = execReplace;
window.updateSearchMatchCount = updateSearchMatchCount;

function updateSearchMatchCount() {
    if(!window.cmView) return;
    const findVal = document.getElementById('find-input').value;
    const countDisplay = document.getElementById('search-count-display');
    if(!countDisplay) return;
    
    if(!findVal) { 
        countDisplay.textContent = ''; 
        return; 
    }
    
    const docText = window.cmView.state.doc.toString();
    const escapedFindVal = findVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedFindVal, 'gi');
    
    let match;
    let total = 0;
    let current = 0;
    const head = window.cmView.state.selection.main.head;
    
    while ((match = regex.exec(docText)) !== null) {
        total++;
        if (match.index <= head && match.index + match[0].length >= head) {
            current = total;
        } else if (match.index < head) {
            current = total;
        }
    }
    
    if (total > 0 && current === 0) current = 1; 
    if (total === 0) {
        countDisplay.textContent = '0 / 0';
    } else {
        countDisplay.textContent = `${current} / ${total}`;
    }
}

function toggleCustomSearch() {
    const panel = document.getElementById('custom-search-panel');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        panel.classList.add('flex');
        let selText = "";
        if (window.cmView) {
            const sel = window.cmView.state.selection.main;
            selText = window.cmView.state.sliceDoc(sel.from, sel.to);
        }
        const input = document.getElementById('find-input');
        if (selText && !selText.includes('\n')) input.value = selText;
        input.focus();
        input.select();
        updateSearchQuery();
    } else {
        closeCustomSearch();
    }
}
function closeCustomSearch() {
    const panel = document.getElementById('custom-search-panel');
    panel.classList.add('hidden');
    panel.classList.remove('flex');
    if(window.cmView) {
        window.cmView.dispatch({ effects: setSearchQuery.of(new SearchQuery({search: ""})) });
        window.cmView.focus();
    }
}
function toggleReplaceRow() {
    const row = document.getElementById('replace-row');
    const icon = document.getElementById('search-expand-icon');
    if(row.classList.contains('hidden')) {
        row.classList.remove('hidden');
        row.classList.add('flex');
        icon.classList.add('rotate-90');
    } else {
        row.classList.add('hidden');
        row.classList.remove('flex');
        icon.classList.remove('rotate-90');
    }
}
function updateSearchQuery() {
    if(!window.cmView) return;
    const findVal = document.getElementById('find-input').value;
    const replaceVal = document.getElementById('replace-input').value;
    window.cmView.dispatch({ effects: setSearchQuery.of(new SearchQuery({search: findVal, replace: replaceVal})) });
    updateSearchMatchCount();
}
function execSearch(dir) {
    if(!window.cmView) return;
    updateSearchQuery();
    if(dir === 'next') findNext(window.cmView);
    else findPrevious(window.cmView);
    setTimeout(updateSearchMatchCount, 10);
}
function execReplace(type) {
    if(!window.cmView) return;
    updateSearchQuery();
    if(type === 'replace') replaceNext(window.cmView);
    else replaceAll(window.cmView);
    setTimeout(updateSearchMatchCount, 10);
}

function copyCurrentTabContent() {
    const activeTab = ['tab-plain', 'tab-rich', 'tab-html'].find(id => !document.getElementById(id).classList.contains('hidden'));
    if (activeTab === 'tab-plain') copyConverterOutput('plain');
    else if (activeTab === 'tab-rich') copyConverterOutput('rich');
    else if (activeTab === 'tab-html') copyConverterOutput('html');
}

function copyConverterOutput(type) {
    if (type === 'plain') {
        const text = document.getElementById('output-plain').value;
        navigator.clipboard.writeText(text).then(() => showToast('纯文本已成功复制', 'success')).catch(() => showToast('复制失败','error'));
    } else if (type === 'html') {
        const text = document.getElementById('output-html').value;
        navigator.clipboard.writeText(text).then(() => showToast('HTML源码已成功复制', 'success')).catch(() => showToast('复制失败','error'));
    } else if (type === 'rich') {
        const richNode = document.getElementById('output-rich');
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(richNode);
        selection.removeAllRanges();
        selection.addRange(range);
        try {
            document.execCommand('copy');
            showToast('富文本已成功复制', 'success');
        } catch(e) {
            showToast('富文本复制失败', 'error');
        }
        selection.removeAllRanges();
    }
}

function getEditorValue() { return window.cmView ? window.cmView.state.doc.toString() : ''; }
function setEditorValue(val) { 
    if(window.cmView) {
        window.cmView.dispatch({ changes: {from: 0, to: window.cmView.state.doc.length, insert: val} });
    }
}

function reqConfirm(title, message, onOk) {
    const modal = document.getElementById('fly-confirm-modal'); const box = document.getElementById('fly-confirm-box');
    document.getElementById('fly-confirm-title').innerText = title; 
    document.getElementById('fly-confirm-msg').innerHTML = message.replace(/\n/g, '<br/>');
    modal.classList.remove('hidden'); setTimeout(() => { modal.classList.remove('opacity-0'); box.classList.remove('scale-95'); }, 10);
    const btnOk = document.getElementById('fly-confirm-ok'); const btnCancel = document.getElementById('fly-confirm-cancel');
    const cleanup = () => { modal.classList.add('opacity-0'); box.classList.add('scale-95'); setTimeout(() => modal.classList.add('hidden'), 200); document.removeEventListener('keydown', keyHandler); };
    btnOk.onclick = () => { cleanup(); if(onOk) onOk(); }; btnCancel.onclick = cleanup;
    const keyHandler = (e) => { if(e.key === 'Enter') { e.preventDefault(); btnOk.click(); } if(e.key === 'Escape') { e.preventDefault(); btnCancel.click(); } };
    document.addEventListener('keydown', keyHandler); btnCancel.focus();
}

function reqPrompt(title, message, defaultVal, onOk) {
    const modal = document.getElementById('fly-prompt-modal'); const box = document.getElementById('fly-prompt-box'); const input = document.getElementById('fly-prompt-input');
    document.getElementById('fly-prompt-title').innerText = title; document.getElementById('fly-prompt-msg').innerHTML = message; input.value = defaultVal || '';
    modal.classList.remove('hidden'); setTimeout(() => { modal.classList.remove('opacity-0'); box.classList.remove('scale-95'); input.focus(); input.select(); }, 10);
    const btnOk = document.getElementById('fly-prompt-ok'); const btnCancel = document.getElementById('fly-prompt-cancel');
    const cleanup = () => { modal.classList.add('opacity-0'); box.classList.add('scale-95'); setTimeout(() => modal.classList.add('hidden'), 200); document.removeEventListener('keydown', keyHandler); };
    btnOk.onclick = () => { const val = input.value.trim(); cleanup(); if(onOk && val) onOk(val); }; btnCancel.onclick = cleanup;
    const keyHandler = (e) => { if(e.key === 'Enter') { e.preventDefault(); btnOk.click(); } if(e.key === 'Escape') { e.preventDefault(); btnCancel.click(); } };
    document.addEventListener('keydown', keyHandler);
}

if (window.mermaid) {
    window.mermaid.initialize({ 
        startOnLoad: false, 
        theme: localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'default',
        flowchart: { htmlLabels: false }, 
        gantt: { useWidth: 800 } 
    });
}

function escapeHtml(unsafe) { return String(unsafe || "").replace(/&/g, "&lt;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

const mathExtensionInline = {
    name: 'mathInline',
    level: 'inline',
    start(src) { return src.indexOf('$'); },
    tokenizer(src, tokens) {
        const match = /^\$([^$\n]+?)\$/.exec(src);
        if (match) return { type: 'mathInline', raw: match[0], text: match[1] };
    },
    renderer(token) { return `<span class="fly-math-inline" data-math="${escapeHtml(token.text)}"></span>`; }
};

const mathExtensionBlock = {
    name: 'mathBlock',
    level: 'block',
    start(src) { return src.indexOf('$$'); },
    tokenizer(src, tokens) {
        const match = /^\$\$([\s\S]+?)\$\$/.exec(src);
        if (match) return { type: 'mathBlock', raw: match[0], text: match[1] };
    },
    renderer(token) { return `<div class="fly-math-block text-center my-4" data-math="${escapeHtml(token.text)}"></div>`; }
};

const markExtension = {
    name: 'markHighlight',
    level: 'inline',
    start(src) { return src.indexOf('=='); },
    tokenizer(src, tokens) {
        const match = /^==([^=\n]+?)==/.exec(src);
        if (match) return { type: 'markHighlight', raw: match[0], text: match[1] };
    },
    renderer(token) { return `<mark class="bg-yellow-200 dark:bg-yellow-700/60 rounded px-1">${escapeHtml(token.text)}</mark>`; }
};

const renderer = {
    code(token) {
        const text = token.text || '';
        const lang = token.lang || '';
        
        if (lang === 'mermaid' || lang === 'echarts') { 
            return `<pre><code class="language-${lang} hidden-raw-code" style="display:none;">${escapeHtml(text)}</code></pre>`; 
        }
        
        let highlighted = escapeHtml(text);
        let validLang = 'plaintext';
        
        if (window.hljs) {
            validLang = window.hljs.getLanguage(lang) ? lang : 'plaintext';
            try { 
                highlighted = window.hljs.highlight(text, { language: validLang }).value; 
            } catch(e) { 
                highlighted = escapeHtml(text); 
            }
        }
        
        return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
    }
};

try {
    const fnPlugin = typeof markedFootnote === 'function' ? markedFootnote() : (markedFootnote.default ? markedFootnote.default() : markedFootnote);
    marked.use(fnPlugin);
} catch(e) { console.warn('Footnote plugin load error', e); }

marked.use({ extensions: [mathExtensionBlock, mathExtensionInline, markExtension] });
marked.use({ renderer: renderer, breaks: true, gfm: true });

function processMarkdownWithMathAndCharts(mdText, targetElement) {
    cleanupEcharts();

    const rawHtml = marked.parse(mdText);
    let cleanHtml = DOMPurify.sanitize(rawHtml, { 
        ADD_TAGS: ['section', 'mark', 'sup'], 
        ADD_ATTR: ['id', 'class', 'target', 'data-math'] 
    });
    
    targetElement.innerHTML = cleanHtml;

    targetElement.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        const li = checkbox.closest('li');
        if (li) {
            li.classList.add('task-list-item');
            const ul = li.closest('ul');
            if (ul) ul.classList.add('task-list');
        }
    });

    targetElement.querySelectorAll('.fly-math-inline').forEach(el => {
        if (window.katex) {
            window.katex.render(el.getAttribute('data-math'), el, {displayMode: false, throwOnError: false});
        }
        let nextNode = el.nextSibling;
        let trailingPunc = '';
        if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
            const match = nextNode.nodeValue.match(/^[.,!?;:\])}\u3002\uff0c\u3001\uff1f\uff01\uff1b\uff1a\u201d\u2019\uff09\]\}\u300b\u300a/);
            if (match) {
                trailingPunc = match[0];
                nextNode.nodeValue = nextNode.nodeValue.substring(trailingPunc.length);
            }
        }
        if (trailingPunc) {
            const wrapper = document.createElement('span');
            wrapper.style.whiteSpace = 'nowrap';
            el.parentNode.insertBefore(wrapper, el);
            wrapper.appendChild(el);
            wrapper.appendChild(document.createTextNode(trailingPunc));
        }
    });
    targetElement.querySelectorAll('.fly-math-block').forEach(el => {
        if (window.katex) {
            window.katex.render(el.getAttribute('data-math'), el, {displayMode: true, throwOnError: false});
        }
    });

    renderCharts(targetElement);
}

function renderCharts(targetElement) {
    const echartsCodes = targetElement.querySelectorAll('code.language-echarts');
    echartsCodes.forEach((codeBlock) => {
        const pre = codeBlock.parentElement; const container = document.createElement('div');
        container.className = 'w-full h-[400px] my-6 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden';
        const sourceText = codeBlock.textContent; pre.parentNode.replaceChild(container, pre);
        try {
            if (window.echarts) {
                const options = window.JSON5 ? window.JSON5.parse(sourceText) : JSON.parse(sourceText);
                const chart = window.echarts.init(container, localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : null);
                chart.setOption(options);
                const resizeObserver = new ResizeObserver(() => chart.resize()); resizeObserver.observe(container);
                
                window._activeEcharts.push(chart);
                window._activeObservers.push(resizeObserver);
            } else {
                container.innerHTML = `<div class="p-4 text-red-500 font-mono text-sm font-bold">Echarts 未加载完成</div>`;
            }
        } catch(e) { 
            container.innerHTML = `<div class="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 font-mono text-xs border border-red-200 dark:border-red-800 rounded">【语法解析失败】图表配置错误：<br/><br/>已开启安全过滤，Echarts 配置仅支持 <b>宽松的 JSON5 格式</b>（允许单引号、无引号键名）。<br/>请检查：<br/>1. 是否遗漏了逗号或括号<br/>2. <b>不可包含 JavaScript 执行函数</b>（如 formatter: function() {...}）</div>`; 
        }
    });

    const mermaidCodes = targetElement.querySelectorAll('code.language-mermaid');
    mermaidCodes.forEach((codeBlock, idx) => {
        const pre = codeBlock.parentElement; const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'mermaid'; mermaidDiv.id = `mermaid-chart-${Date.now()}-${idx}`;
        mermaidDiv.textContent = codeBlock.textContent; pre.parentNode.replaceChild(mermaidDiv, pre);
    });
    if (mermaidCodes.length > 0 && window.mermaid) {
        try { window.mermaid.run({ nodes: targetElement.querySelectorAll('.mermaid'), suppressErrors: true }).catch(e=>{}); } catch(err) { }
    }
}

async function createExportContainer(isWord = false) {
    showToast("正在后台构建标准化独立排版，请稍候...", "info");
    const exportContainer = document.createElement('div');
    exportContainer.style.position = 'absolute';
    exportContainer.style.top = '0'; 
    exportContainer.style.left = '0'; 
    exportContainer.style.zIndex = '-9999'; 
    exportContainer.style.opacity = '0'; 
    exportContainer.style.width = '850px'; 
    exportContainer.style.backgroundColor = '#ffffff';
    exportContainer.style.pointerEvents = 'none';
    
    const innerDiv = document.createElement('div');
    innerDiv.className = 'prose max-w-none break-words bg-white text-gray-900'; 
    innerDiv.style.padding = '40px 60px'; 
    
    exportContainer.appendChild(innerDiv);
    document.body.appendChild(exportContainer);

    const mdText = getEditorValue();
    processMarkdownWithMathAndCharts(mdText, innerDiv);

    await new Promise(resolve => setTimeout(resolve, 1000));

    innerDiv.querySelectorAll('details').forEach(det => {
        det.setAttribute('open', 'true');
        const div = document.createElement('div');
        div.innerHTML = det.innerHTML;
        div.className = det.className;
        det.parentNode.replaceChild(div, det);
    });

    innerDiv.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        const span = document.createElement('span');
        span.innerHTML = checkbox.checked ? '☑' : '☐';
        span.style.fontSize = '1.2em';
        span.style.color = checkbox.checked ? '#3b82f6' : '#94a3b8';
        span.style.marginRight = '6px';
        span.style.display = 'inline-block';
        span.style.verticalAlign = 'middle';
        checkbox.parentNode.replaceChild(span, checkbox);
    });

    innerDiv.querySelectorAll('del, s, strike').forEach(el => {
        el.style.textDecoration = 'none';
        el.style.position = 'relative';
        const line = document.createElement('span');
        line.className = 'fly-export-del-line'; 
        line.style.position = 'absolute';
        line.style.left = '0';
        line.style.right = '0';
        line.style.top = '50%';
        line.style.borderTop = '1.5px solid currentColor';
        line.style.marginTop = '-0.5px'; 
        line.style.opacity = '0.8';
        el.appendChild(line);
    });

    innerDiv.querySelectorAll('.mermaid svg').forEach(svg => {
        const bbox = svg.getBoundingClientRect();
        if (bbox.width && !svg.getAttribute('width')) {
            svg.setAttribute('width', bbox.width);
            svg.setAttribute('height', bbox.height);
        }
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
    });

    const exportCanvases = innerDiv.querySelectorAll('canvas');
    exportCanvases.forEach((canvas) => {
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png', 1.0);
        const w = canvas.offsetWidth || canvas.width;
        const h = canvas.offsetHeight || canvas.height;
        img.setAttribute('width', w);
        img.setAttribute('height', h);
        img.style.width = w + 'px';
        img.style.height = h + 'px';
        img.style.maxWidth = '100%';
        img.style.display = 'block';
        img.style.margin = '1rem auto';
        canvas.parentNode.replaceChild(img, canvas);
    });

    let complexSelector = '.fly-math-block, .mermaid';
    if (isWord) complexSelector += ', .fly-math-inline';
    const complexElements = innerDiv.querySelectorAll(complexSelector);
    
    for (let el of complexElements) {
        try {
            const isInline = el.classList.contains('fly-math-inline');
            const origDisplay = el.style.display;
            const origPadding = el.style.padding;
            const origBg = el.style.backgroundColor;
            
            if (isInline) {
                el.style.display = 'inline-block';
                el.style.padding = '2px 4px'; 
            } else {
                el.style.backgroundColor = '#ffffff';
                el.style.padding = '15px'; 
            }

            const canvas = await window.html2canvas(el, { backgroundColor: '#ffffff', scale: 2, logging: false });
            
            el.style.display = origDisplay;
            el.style.padding = origPadding;
            el.style.backgroundColor = origBg;

            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png', 1.0);
            
            let w = canvas.width / 2;
            let h = canvas.height / 2;

            if (isInline) {
                img.style.width = w + 'px';
                img.style.height = h + 'px';
                img.style.verticalAlign = 'middle';
                img.style.margin = '0 2px'; 
                el.parentNode.replaceChild(img, el);
            } else {
                if (w > 650) { h = h * (650 / w); w = 650; } 
                img.setAttribute('width', Math.round(w));
                img.setAttribute('height', Math.round(h));
                img.style.width = Math.round(w) + 'px';
                img.style.height = Math.round(h) + 'px';
                img.style.maxWidth = '100%';
                img.style.display = 'block';
                img.style.margin = '15pt auto';
                el.parentNode.replaceChild(img, el);
            }
        } catch (e) { console.warn('复杂块级元素光栅化截图失败', e); }
    }

    const imgs = innerDiv.querySelectorAll('img');
    await Promise.all(Array.from(imgs).map(img => new Promise(resolve => {
        if (img.complete) return resolve();
        img.onload = resolve;
        img.onerror = resolve; 
    })));

    if (isWord) {
        innerDiv.querySelectorAll('pre').forEach(pre => {
            const codeEl = pre.querySelector('code');
            const codeText = codeEl ? (codeEl.innerText || codeEl.textContent) : (pre.innerText || pre.textContent);
            pre.innerHTML = `<code style="font-family: 'Consolas', 'Monaco', monospace; font-size: 10pt; color: #334155;">${escapeHtml(codeText)}</code>`;
            pre.style.backgroundColor = '#f1f5f9';
            pre.style.padding = '12pt';
            pre.style.border = '1px solid #cbd5e1';
            pre.style.borderRadius = '6px';
            pre.style.whiteSpace = 'pre-wrap'; 
        });

        innerDiv.querySelectorAll('table').forEach(tbl => {
            tbl.setAttribute('border', '1');
            tbl.style.borderCollapse = 'collapse';
            tbl.style.width = '100%';
            tbl.querySelectorAll('th, td').forEach(cell => {
                cell.style.border = '1px solid #cbd5e1';
                cell.style.padding = '8pt';
            });
        });
        
        innerDiv.querySelectorAll('.fly-export-del-line').forEach(line => line.remove());
        innerDiv.querySelectorAll('del, s, strike').forEach(el => {
            el.style.position = '';
            el.style.textDecoration = 'line-through';
        });

        innerDiv.querySelectorAll('mark').forEach(mark => {
            mark.style.backgroundColor = 'yellow';
            mark.style.color = 'black';
        });
    }

    innerDiv.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('width')) {
            const rect = img.getBoundingClientRect();
            let w = rect.width || img.naturalWidth || 600;
            let h = rect.height || img.naturalHeight || 400;
            if (w > 650) { h = h * (650 / w); w = 650; }
            img.setAttribute('width', Math.round(w));
            img.setAttribute('height', Math.round(h));
            img.style.width = Math.round(w) + 'px';
            img.style.height = Math.round(h) + 'px';
        }
    });

    await new Promise(resolve => setTimeout(resolve, 200));
    return exportContainer;
}

function updateSaveStatusUI() {
    const statusEl = document.getElementById('save-status'); if(!statusEl) return;
    if (window.isUnsaved) {
        statusEl.innerHTML = `<i class="fa-solid fa-pen mr-1"></i> 编辑中`;
        statusEl.className = "flex items-center text-xs font-bold text-yellow-600 dark:text-yellow-500 transition-colors";
    } else {
        const diffSecs = Math.floor((Date.now() - lastSaveTime) / 1000);
        let timeStr = "刚刚保存";
        if (diffSecs >= 3600) { timeStr = `${Math.floor(diffSecs / 3600)} 小时前保存`; } 
        else if (diffSecs >= 60) { timeStr = `${Math.floor(diffSecs / 60)} 分钟前保存`; }
        statusEl.innerHTML = `<i class="fa-solid fa-check mr-1.5"></i>${timeStr}`;
        statusEl.className = "flex items-center text-xs font-medium text-green-600 dark:text-green-400 transition-colors";
    }
}
setInterval(updateSaveStatusUI, 10000); 

window.addEventListener('beforeunload', (e) => {
    if (window.isUnsaved) { e.preventDefault(); e.returnValue = '未保存内容将丢失，离开吗？'; }
});

function updateStats() {
    const charCount = document.getElementById('char-count'); if (!charCount || !window.cmView) return;
    const doc = window.cmView.state.doc;
    charCount.innerHTML = `<span class="font-bold">${doc.lines} 行</span> <span class="mx-1.5 opacity-40">|</span> <span>${doc.length} 字符</span>`;
}

function generateTOC() {
    const tocList = document.getElementById('toc-list'); tocList.innerHTML = '';
    const headings = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;
    headings.forEach((heading, index) => {
        const id = `heading-${index}`; heading.id = id; const level = parseInt(heading.tagName.substring(1));
        const link = document.createElement('a'); link.href = `#${id}`; link.textContent = heading.innerText;
        link.style.paddingLeft = `${(level - 1) * 12}px`;
        link.className = `block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-slate-700 py-1.5 px-2 rounded transition-colors truncate ${level <= 2 ? 'font-semibold' : ''}`;
        
        link.onclick = (e) => { 
            e.preventDefault(); 
            isTOCScrolling = true; 
            
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            if (window.cmView && !document.getElementById('main-workspace').classList.contains('is-preview-mode')) {
                const doc = window.cmView.state.doc;
                const headingText = heading.innerText.trim();
                const prefix = '#'.repeat(level);
                
                let targetLineInfo = null;
                for (let i = 1; i <= doc.lines; i++) {
                    const line = doc.line(i);
                    if (line.text.startsWith(prefix) && line.text.includes(headingText)) {
                        targetLineInfo = line;
                        break;
                    }
                }
                
                if (targetLineInfo) {
                    window.cmView.dispatch({
                        effects: EditorView.scrollIntoView(targetLineInfo.from, { y: "start", yMargin: 60 })
                    });
                }
            }
            
            setTimeout(() => { isTOCScrolling = false; }, 800);
        };
        tocList.appendChild(link);
    });
    throttledUpdateActiveTOC(); 
}

function updateActiveTOC() {
    const headings = preview.querySelectorAll('h1, h2, h3, h4, h5, h6'); const tocLinks = document.querySelectorAll('#toc-list a');
    if(headings.length === 0 || tocLinks.length === 0) return;
    let currentActiveId = headings[0].id;
    for (let i = 0; i < headings.length; i++) { const rect = headings[i].getBoundingClientRect(); if (rect.top <= 150) currentActiveId = headings[i].id; else break; }
    tocLinks.forEach(link => {
        if (link.getAttribute('href') === `#${currentActiveId}`) {
            link.classList.add('text-blue-600', 'bg-blue-50', 'dark:bg-slate-800', 'dark:text-blue-400'); link.classList.remove('text-gray-600', 'dark:text-gray-300'); link.style.fontWeight = 'bold';
        } else {
            link.classList.remove('text-blue-600', 'bg-blue-50', 'dark:bg-slate-800', 'dark:text-blue-400'); link.classList.add('text-gray-600', 'dark:text-gray-300'); link.style.fontWeight = 'normal';
        }
    });
}

let tocThrottleTimer = null;
function throttledUpdateActiveTOC() {
    if (tocThrottleTimer) return;
    tocThrottleTimer = requestAnimationFrame(() => {
        updateActiveTOC();
        tocThrottleTimer = null;
    });
}

function initSyncScroll() {
    const scroller = document.getElementById('preview-scroller');
    let editorScroller = window.cmView.scrollDOM;
    let lastScrollEditor = 0;
    let lastScrollPreview = 0;

    editorScroller.addEventListener('scroll', () => {
        if (isTOCScrolling) return; 
        if (Date.now() - lastScrollPreview < 80) return; 
        lastScrollEditor = Date.now();
        const maxLeft = editorScroller.scrollHeight - editorScroller.clientHeight;
        const maxRight = scroller.scrollHeight - scroller.clientHeight;
        if (maxLeft > 0 && maxRight > 0) {
            const ratio = editorScroller.scrollTop / maxLeft;
            scroller.scrollTop = Math.round(ratio * maxRight);
        }
    });

    scroller.addEventListener('scroll', () => {
        throttledUpdateActiveTOC(); 
        if (isTOCScrolling) return; 
        if (Date.now() - lastScrollEditor < 80) return; 
        lastScrollPreview = Date.now();
        const maxLeft = editorScroller.scrollHeight - editorScroller.clientHeight;
        const maxRight = scroller.scrollHeight - scroller.clientHeight;
        if (maxLeft > 0 && maxRight > 0) {
            const ratio = scroller.scrollTop / maxRight;
            editorScroller.scrollTop = Math.round(ratio * maxLeft);
        }
    }, { passive: true });
}

function toggleTOC() {
    const tocPane = document.getElementById('toc-pane');
    const tocResizer = document.getElementById('toc-resizer');
    if (tocPane.classList.contains('hidden')) { 
        tocPane.classList.remove('hidden'); tocPane.style.display = 'flex';
        if(tocResizer) { tocResizer.classList.remove('hidden'); tocResizer.style.display = 'flex'; }
    } else { 
        tocPane.classList.add('hidden'); tocPane.style.display = 'none';
        if(tocResizer) { tocResizer.classList.add('hidden'); tocResizer.style.display = 'none'; }
    }
    setTimeout(() => { if (window.cmView) window.cmView.requestMeasure(); }, 350);
}

function updatePreview() { 
    if (!window.cmView) return;
    const mdText = getEditorValue(); 
    updateStats(); 
    processMarkdownWithMathAndCharts(mdText, preview); 
    generateTOC(); 
}

async function init() {
    const isDark = localStorage.getItem(THEME_KEY) === 'dark';
    if(isDark) { document.documentElement.classList.add('dark'); document.getElementById('theme-icon').className = 'fa-solid fa-sun text-yellow-400'; }
    
    const state = EditorState.create({
        doc: "",
        extensions: [
            lineNumbers(),
            highlightActiveLineGutter(),
            highlightSpecialChars(),
            history(),
            foldGutter(), 
            drawSelection(),
            dropCursor(),
            EditorState.allowMultipleSelections.of(true),
            syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
            syntaxHighlighting(markdownStyles), 
            bracketMatching(),
            rectangularSelection(),
            crosshairCursor(),
            highlightActiveLine(),
            search({ top: true }), 
            highlightSelectionMatches(),
            base64FoldPlugin,
            keymap.of([
                { key: "Enter", run: listContinueCommand }, 
                { key: "Mod-s", run: () => { forceSave(false); return true; } },
                { key: "Mod-f", run: () => { toggleCustomSearch(); return true; } }, 
                ...defaultKeymap,
                ...historyKeymap,
            ]),
            markdown({ codeLanguages: languages }),
            EditorView.lineWrapping,
            themeConfig.of(isDark ? oneDark : syntaxHighlighting(customLightHighlight)),
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    if(!window.isUnsaved) { window.isUnsaved = true; updateSaveStatusUI(); }
                    clearTimeout(previewRenderTimeout);
                    previewRenderTimeout = setTimeout(() => { updatePreview(); }, 300);
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => { forceSave(true); }, 3000);
                }
                
                if (update.selectionSet || update.docChanged) {
                    const searchPanel = document.getElementById('custom-search-panel');
                    if (searchPanel && !searchPanel.classList.contains('hidden')) {
                        updateSearchMatchCount();
                    }
                }
            })
        ]
    });

    window.cmView = new EditorView({
        state,
        parent: document.getElementById('editor-container')
    });

    await initFileSystem();
    updatePreview();
    initSyncScroll();
    bindProductivityEvents(); 
    initDraggableSplitters();

    document.getElementById('preview').addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
            const targetId = link.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId) || document.getElementById(decodeURIComponent(targetId));
            if (targetEl) {
                e.preventDefault();
                const scroller = document.getElementById('preview-scroller');
                const targetTop = targetEl.getBoundingClientRect().top;
                const scrollerTop = scroller.getBoundingClientRect().top;
                scroller.scrollTo({ top: scroller.scrollTop + targetTop - scrollerTop - 60, behavior: 'smooth' });
                
                targetEl.classList.add('bg-yellow-200', 'dark:bg-yellow-900/50', 'transition-colors', 'duration-500', 'rounded-md', 'px-1');
                setTimeout(() => targetEl.classList.remove('bg-yellow-200', 'dark:bg-yellow-900/50'), 1500);
            }
        }
    });
}

function showContextMenu(e, id, type) {
    e.stopPropagation(); e.preventDefault();
    const menu = document.getElementById('file-context-menu'); menu.innerHTML = '';
    const createBtn = (icon, text, onClick, colorClass="text-gray-700 dark:text-gray-300") => {
        const btn = document.createElement('button');
        btn.className = `w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors ${colorClass}`;
        btn.innerHTML = `<i class="fa-solid ${icon} w-4 text-center"></i> <span>${text}</span>`;
        btn.onclick = (e) => { e.stopPropagation(); menu.classList.add('hidden'); onClick(); }; return btn;
    };

    if (type === 'directory') {
        menu.appendChild(createBtn('fa-file-circle-plus', '新建文件', () => reqCreateNewFile(id)));
        menu.appendChild(createBtn('fa-folder-plus', '新建子文件夹', () => reqCreateNewFolder(id)));
        menu.appendChild(createBtn('fa-copy', '复制目录名', () => copyItemName(id)));
        menu.appendChild(createBtn('fa-trash', '彻底删除目录', () => reqDeleteFile(id), 'text-red-600 dark:text-red-400'));
    } else {
        menu.appendChild(createBtn('fa-copy', '复制文件名', () => copyItemName(id)));
        menu.appendChild(createBtn('fa-pen', '重命名', () => reqRenameFile(id)));
        menu.appendChild(createBtn('fa-trash', '彻底删除文件', () => reqDeleteFile(id), 'text-red-600 dark:text-red-400'));
    }

    menu.classList.remove('hidden');
    let x = e.clientX; let y = e.clientY; menu.style.left = `${x}px`; menu.style.top = `${y}px`;
    requestAnimationFrame(() => {
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) menu.style.left = `${window.innerWidth - rect.width - 10}px`;
        if (rect.bottom > window.innerHeight) menu.style.top = `${window.innerHeight - rect.height - 10}px`;
    });
}

async function copyItemName(id) {
    const isLocal = currentStorageMode === 'local';
    const file = isLocal ? localFiles.find(f => f.id === id) : browserFiles.find(f => f.id === id);
    if (file) { try { await navigator.clipboard.writeText(file.name); showToast("名称已复制", "success"); } catch(e) { } }
}

async function initFileSystem() {
    renderStorageModeUI();
    if (currentStorageMode === 'browser') { await loadBrowserFiles(); } 
    else {
        localFiles = []; activeFileId = null;
        document.getElementById('file-list').innerHTML = '<div class="p-4 text-center text-xs text-gray-500">隐私设定：刷新需重新授权挂载<br/><br/><button onclick="setStorageMode(\'local\')" class="bg-blue-600 text-white px-3 py-1.5 rounded shadow">立刻挂载文件夹</button></div>';
    }
}

function renderStorageModeUI() {
    const btnB = document.getElementById('btn-mode-browser'); const btnL = document.getElementById('btn-mode-local');
    if (!btnB || !btnL) return;
    if (currentStorageMode === 'browser') {
        btnB.className = "flex-1 py-1.5 text-xs rounded-md bg-blue-100 text-blue-700 dark:bg-slate-700 dark:text-blue-400 font-bold transition shadow-sm border border-blue-200 dark:border-slate-600";
        btnL.className = "flex-1 py-1.5 text-xs rounded-md text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-800 transition border border-transparent hover:border-gray-300 dark:hover:border-slate-600";
    } else {
        btnL.className = "flex-1 py-1.5 text-xs rounded-md bg-purple-100 text-purple-700 dark:bg-slate-700 dark:text-purple-400 font-bold transition shadow-sm border border-purple-200 dark:border-slate-600";
        btnB.className = "flex-1 py-1.5 text-xs rounded-md text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-800 transition border border-transparent hover:border-gray-300 dark:hover:border-slate-600";
    }
}

async function setStorageMode(mode) {
    if (currentStorageMode === mode) { if(mode === 'local') return mountLocalDirectory(); return; }
    if (mode === 'local') {
        reqConfirm("挂载系统文件夹", "将直接读取操作系统的物理文件夹。<br/>完美支持无限层级的树状折叠展示和本地管理操作。", async () => { await mountLocalDirectory(); });
    } else {
        currentStorageMode = 'browser'; localStorage.setItem('fly_storage_mode', 'browser'); rootDirHandle = null; localFiles = [];
        await loadBrowserFiles(); renderStorageModeUI();
    }
}

async function loadBrowserFiles() {
    try {
        let saved = JSON.parse(localStorage.getItem(FILES_DB_KEY));
        if (!saved || !Array.isArray(saved) || saved.length === 0) {
            const oldContent = localStorage.getItem('md_editor_autosave');
            browserFiles = [{ id: 'file_' + Date.now(), name: '无标题文档.md', content: oldContent || defaultMarkdown }];
        } else { browserFiles = saved; }
    } catch(e) { browserFiles = [{ id: 'file_' + Date.now(), name: '无标题文档.md', content: defaultMarkdown }]; }
    if (browserFiles.length > 0) await switchFile(browserFiles[0].id); else reqCreateNewFile('root');
    renderFileList();
}

async function loadDirChildren(dirHandle, parentId, depth) {
    const items = [];
    for await (const entry of dirHandle.values()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const id = parentId + '/' + entry.name;
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
            items.push({ id, name: entry.name, type: 'file', handle: entry, parentHandle: dirHandle, parentId, depth });
        } else if (entry.kind === 'directory') {
            items.push({ id, name: entry.name, type: 'directory', handle: entry, parentHandle: dirHandle, parentId, depth, isOpen: false });
        }
    }
    items.sort((a,b) => { if (a.type === b.type) return a.name.localeCompare(b.name); return a.type === 'directory' ? -1 : 1; });
    localFiles = localFiles.filter(f => f.parentId !== parentId); 
    localFiles.push(...items);
}

async function mountLocalDirectory() {
    if (!window.showDirectoryPicker) {
        showToast("您的浏览器目前不支持本地文件系统直连API (请使用最新版 Chrome/Edge)", "error");
        currentStorageMode = 'browser'; localStorage.setItem('fly_storage_mode', 'browser'); 
        renderStorageModeUI(); loadBrowserFiles();
        return;
    }
    try {
        rootDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        currentStorageMode = 'local'; localStorage.setItem('fly_storage_mode', 'local');
        localFiles = []; renderStorageModeUI();
        showToast("正在读取文件夹树...", "info");
        await loadDirChildren(rootDirHandle, 'root', 0);
        const firstFile = localFiles.find(f => f.type === 'file');
        if (firstFile) { await switchFile(firstFile.id); } else { reqCreateNewFile('root'); }
        renderFileList();
    } catch (err) {
        if (err.name !== 'AbortError') { showToast("挂载被拒绝", "error"); }
        if (currentStorageMode === 'local' && localFiles.length === 0) { currentStorageMode = 'browser'; localStorage.setItem('fly_storage_mode', 'browser'); renderStorageModeUI(); loadBrowserFiles(); }
    }
}

async function toggleDirectoryExpand(id) {
    const dir = localFiles.find(f => f.id === id); if(!dir) return;
    if (dir.isOpen) { dir.isOpen = false; } 
    else {
        dir.isOpen = true; const hasChildren = localFiles.some(f => f.parentId === id);
        if (!hasChildren) await loadDirChildren(dir.handle, id, dir.depth + 1);
    }
    renderFileList();
}

function renderFileList() {
    const listEl = document.getElementById('file-list'); if (!listEl) return;
    const query = document.getElementById('file-search-input').value.toLowerCase(); listEl.innerHTML = '';
    if (currentStorageMode === 'browser') {
        const filtered = browserFiles.filter(f => f.name.toLowerCase().includes(query));
        if (filtered.length === 0) { listEl.innerHTML = `<div class="text-center text-xs text-gray-400 mt-4">没有文件</div>`; return; }
        filtered.forEach(f => {
            const isActive = f.id === activeFileId; const div = document.createElement('div');
            div.className = `file-item group flex items-center justify-between pl-4 pr-2 py-2 cursor-pointer transition-colors ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-slate-700 dark:text-blue-400 border-l-4 border-blue-500 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 border-l-4 border-transparent'}`;
            div.innerHTML = `<div class="file-item-name flex-1 mr-2 pr-2 truncate" onclick="switchFile('${f.id}')" title="${escapeHtml(f.name)}"><i class="fa-brands fa-markdown mr-1.5 opacity-50"></i>${escapeHtml(f.name)}</div><div class="flex gap-1 shrink-0"><button onclick="showContextMenu(event, '${f.id}', 'file')" class="w-6 h-6 rounded hover:bg-gray-300 dark:hover:bg-slate-600 transition flex items-center justify-center text-gray-500 opacity-0 group-hover:opacity-100 focus:opacity-100"><i class="fa-solid fa-ellipsis"></i></button></div>`;
            listEl.appendChild(div);
        });
    } else {
        let foundAny = false;
        function appendChildren(parentId) {
            const children = localFiles.filter(f => f.parentId === parentId);
            children.forEach(f => {
                if (query && !f.name.toLowerCase().includes(query) && f.type === 'file') return;
                foundAny = true; const div = document.createElement('div'); div.style.paddingLeft = `${f.depth * 14 + 16}px`;
                if (f.type === 'directory') {
                    div.className = `file-item group flex items-center justify-between pr-2 py-1.5 cursor-pointer transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 border-l-4 border-transparent`;
                    div.innerHTML = `<div class="file-item-name flex-1 mr-2 pr-2 font-medium select-none truncate" onclick="toggleDirectoryExpand('${f.id}')" title="${escapeHtml(f.name)}"><i class="fa-solid ${f.isOpen ? 'fa-folder-open' : 'fa-folder'} text-yellow-500 mr-2 opacity-90 w-4 text-center"></i>${escapeHtml(f.name)}</div><div class="flex gap-1 shrink-0"><button onclick="showContextMenu(event, '${f.id}', 'directory')" class="w-6 h-6 rounded hover:bg-gray-300 dark:hover:bg-slate-600 transition flex items-center justify-center text-gray-500 opacity-0 group-hover:opacity-100 focus:opacity-100"><i class="fa-solid fa-ellipsis"></i></button></div>`;
                    listEl.appendChild(div); if (f.isOpen || query) appendChildren(f.id);
                } else {
                    const isActive = f.id === activeFileId;
                    div.className = `file-item group flex items-center justify-between pr-2 py-1.5 cursor-pointer transition-colors ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-slate-700 dark:text-blue-400 border-l-4 border-blue-500 font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 border-l-4 border-transparent'}`;
                    div.innerHTML = `<div class="file-item-name flex-1 mr-2 pr-2 truncate" onclick="switchFile('${f.id}')" title="${escapeHtml(f.name)}"><i class="fa-brands fa-markdown mr-1.5 w-4 text-center opacity-50 text-blue-500"></i>${escapeHtml(f.name)}</div><div class="flex gap-1 shrink-0"><button onclick="showContextMenu(event, '${f.id}', 'file')" class="w-6 h-6 rounded hover:bg-gray-300 dark:hover:bg-slate-600 transition flex items-center justify-center text-gray-500 opacity-0 group-hover:opacity-100 focus:opacity-100"><i class="fa-solid fa-ellipsis"></i></button></div>`;
                    listEl.appendChild(div);
                }
            });
        }
        appendChildren('root');
        if (!foundAny) { listEl.innerHTML = `<div class="text-center text-xs text-gray-400 mt-4">无匹配文件</div>`; }
    }
}

async function switchFile(id) {
    if (activeFileId && window.isUnsaved) await forceSave(true); 
    const file = currentStorageMode === 'local' ? localFiles.find(f => f.id === id) : browserFiles.find(f => f.id === id); 
    if (!file) return;

    if (currentStorageMode === 'local' && file.content === undefined) {
        try { const fileData = await file.handle.getFile(); file.content = await fileData.text(); } 
        catch(e) { showToast("无法读取该物理文件", "error"); return; }
    }

    activeFileId = id; 
    setEditorValue(file.content || '');
    document.getElementById('current-filename-display').innerHTML = `<i class="fa-solid fa-file-lines text-blue-500 mr-1.5"></i> ${escapeHtml(file.name)}`;
    window.isUnsaved = false; lastSaveTime = Date.now(); updateSaveStatusUI(); updatePreview(); renderFileList();
}

async function saveCurrentFile() {
    if (!activeFileId) return;
    const content = getEditorValue(); 
    if (currentStorageMode === 'browser') {
        const fileIndex = browserFiles.findIndex(f => f.id === activeFileId); if (fileIndex === -1) return;
        browserFiles[fileIndex].content = content; localStorage.setItem(FILES_DB_KEY, JSON.stringify(browserFiles));
        window.isUnsaved = false; lastSaveTime = Date.now(); updateSaveStatusUI(); checkAndSaveSnapshot(content);
    } else if (currentStorageMode === 'local') {
        const file = localFiles.find(f => f.id === activeFileId);
        if (file && file.handle) {
            try {
                const writable = await file.handle.createWritable(); await writable.write(content); await writable.close();
                file.content = content; window.isUnsaved = false; lastSaveTime = Date.now(); updateSaveStatusUI(); checkAndSaveSnapshot(content);
            } catch (e) { showToast("物理写入失败，请检查权限", "error"); }
        }
    }
}

async function forceSave(isAuto = false) {
    if (!window.isUnsaved && !isAuto) { if(!isAuto) showToast("内容未改变", "info"); return; }
    await saveCurrentFile(); if (!isAuto) showToast("手动保存成功", "success");
}

async function reqCreateNewFile(parentId = 'root') {
    reqPrompt("创建新文件", "以 .md 结尾", "新建文档.md", async (name) => {
        if (!name.endsWith('.md')) name += '.md'; const content = `# ${name}\n\n`;
        if (currentStorageMode === 'browser') {
            const id = 'file_' + Date.now(); browserFiles.unshift({ id, name, content }); localStorage.setItem(FILES_DB_KEY, JSON.stringify(browserFiles));
            switchFile(id); showToast("文件创建成功", "success");
        } else if (currentStorageMode === 'local') {
            if(!rootDirHandle) return showToast("挂载丢失", "error");
            try {
                let targetDirHandle = rootDirHandle; let depth = 0;
                if (parentId !== 'root') {
                    const parentDir = localFiles.find(f => f.id === parentId);
                    if (parentDir) { targetDirHandle = parentDir.handle; depth = parentDir.depth + 1; parentDir.isOpen = true; }
                }
                const newHandle = await targetDirHandle.getFileHandle(name, {create: true});
                const writable = await newHandle.createWritable(); await writable.write(content); await writable.close();
                const newId = parentId + '/' + name;
                localFiles.unshift({ id: newId, name, content, handle: newHandle, parentId: parentId, parentHandle: targetDirHandle, depth: depth, type: 'file' });
                switchFile(newId); showToast("物理文件已创建", "success");
            } catch(e) { return showToast("创建失败，文件可能已存在", "error"); }
        }
    });
}

async function reqCreateNewFolder(parentId = 'root') {
    if (currentStorageMode !== 'local' || !rootDirHandle) return;
    reqPrompt("创建文件夹", "请输入文件夹名称：", "新文件夹", async (name) => {
        try {
            let targetDirHandle = rootDirHandle; let depth = 0;
            if (parentId !== 'root') {
                const parentDir = localFiles.find(f => f.id === parentId);
                if (parentDir) { targetDirHandle = parentDir.handle; depth = parentDir.depth + 1; parentDir.isOpen = true; }
            }
            const newHandle = await targetDirHandle.getDirectoryHandle(name, {create: true});
            localFiles.unshift({ id: parentId + '/' + name, name, type: 'directory', handle: newHandle, parentId: parentId, parentHandle: targetDirHandle, depth: depth, isOpen: false });
            renderFileList(); showToast("文件夹创建成功", "success");
        } catch(e) { showToast("创建失败，可能存在同名项", "error"); }
    });
}

function reqDeleteFile(id) {
    const isLocal = currentStorageMode === 'local';
    const file = isLocal ? localFiles.find(f => f.id === id) : browserFiles.find(f => f.id === id); if(!file) return;
    reqConfirm("彻底删除", `确定彻底删除 <b>${escapeHtml(file.name)}</b> 吗？<br/>${file.type === 'directory' ? '<span class="text-red-500">此操作将同时删除其内部所有子文件！</span>' : ''}`, async () => {
        if (isLocal) {
            try {  await file.parentHandle.removeEntry(file.name, { recursive: true }); } catch(e) { return showToast("删除物理文件失败", "error"); }
            localFiles = localFiles.filter(f => f.id !== id && !f.parentId.startsWith(id));
        } else {
            browserFiles = browserFiles.filter(f => f.id !== id); localStorage.setItem(FILES_DB_KEY, JSON.stringify(browserFiles));
        }
        if (activeFileId === id || (activeFileId && activeFileId.startsWith(id + '/'))) {
            const nextFile = isLocal ? localFiles.find(f => f.type === 'file') : browserFiles[0];
            if (nextFile) switchFile(nextFile.id); else { activeFileId = null; setEditorValue(''); document.getElementById('current-filename-display').innerHTML="<i class='fa-solid fa-code mr-1'></i> 编辑器"; }
        }
        renderFileList(); showToast("已彻底删除", "success");
    });
}

function reqRenameFile(id) {
    const isLocal = currentStorageMode === 'local';
    const file = isLocal ? localFiles.find(f => f.id === id) : browserFiles.find(f => f.id === id); if(!file) return;
    reqPrompt("重命名", "请输入新名称：", file.name, async (newName) => {
        if (newName === file.name || !newName) return;
        if (!newName.endsWith('.md') && file.type === 'file') newName += '.md';
        if (isLocal) {
            try {
                const fileData = await file.handle.getFile(); const content = await fileData.text();
                const newHandle = await file.parentHandle.getFileHandle(newName, {create: true});
                const writable = await newHandle.createWritable(); await writable.write(content); await writable.close();
                await file.parentHandle.removeEntry(file.name);
                file.name = newName; file.handle = newHandle;
                if (activeFileId === id) document.getElementById('current-filename-display').innerHTML = `<i class="fa-solid fa-file-lines text-blue-500 mr-1.5"></i> ${escapeHtml(newName)}`;
                renderFileList(); showToast("重命名成功", "success");
            } catch (e) { showToast("本地重命名失败 (可能存在同名)", "error"); }
        } else {
            file.name = newName; localStorage.setItem(FILES_DB_KEY, JSON.stringify(browserFiles));
            if (activeFileId === id) document.getElementById('current-filename-display').innerHTML = `<i class="fa-solid fa-file-lines text-blue-500 mr-1.5"></i> ${escapeHtml(newName)}`;
            renderFileList(); showToast("重命名成功", "success");
        }
    });
}

function collapseFileSidebar() { document.getElementById('file-sidebar').classList.add('hidden'); document.getElementById('file-sidebar-collapsed').classList.remove('hidden'); setTimeout(() => { if (window.cmView) window.cmView.requestMeasure(); }, 350); }
function expandFileSidebar() { document.getElementById('file-sidebar-collapsed').classList.add('hidden'); document.getElementById('file-sidebar').classList.remove('hidden'); setTimeout(() => { if (window.cmView) window.cmView.requestMeasure(); }, 350); }

function checkAndSaveSnapshot(content) {
    if (!content || content === defaultMarkdown) return;
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); const now = Date.now();
    if (history.length === 0) { history.push({ time: now, content: content, manual: false }); } 
    else {
        const lastSnap = history[history.length - 1]; const timeDiff = now - lastSnap.time; const lenDiff = Math.abs(content.length - lastSnap.content.length);
        if ((timeDiff > 5 * 60 * 1000 && lenDiff > 10) || (timeDiff > 30 * 60 * 1000 && content !== lastSnap.content)) { history.push({ time: now, content: content, manual: false }); }
    }
    if (history.length > MAX_HISTORY) history = history.slice(history.length - MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function manualSnapshot() {
    const content = getEditorValue(); if (!content) return;
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); const now = Date.now();
    if (history.length > 0 && history[history.length-1].content === content) { showToast("无变化，无需抓拍", "warning"); return; }
    history.push({ time: now, content: content, manual: true });
    if (history.length > MAX_HISTORY) history = history.slice(history.length - MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); showToast("📸 快照保存成功", "success");
}

function openHistoryModal() { renderHistoryListModal(); document.getElementById('history-preview').value = ''; document.getElementById('btn-restore-history').disabled = true; document.getElementById('history-modal').classList.remove('hidden'); }
function closeHistoryModal() { document.getElementById('history-modal').classList.add('hidden'); }

function openHelpModal() { document.getElementById('help-modal').classList.remove('hidden'); }
function closeHelpModal() { document.getElementById('help-modal').classList.add('hidden'); }

function renderHistoryListModal() {
    const listEl = document.getElementById('history-list'); const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); listEl.innerHTML = '';
    if (history.length === 0) { listEl.innerHTML = '<div class="p-8 text-center text-gray-500 text-sm">暂无记录</div>'; return; }
    history.slice().reverse().forEach((item) => {
        const timeStr = new Date(item.time).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second:'2-digit' });
        const badge = item.manual ? '<span class="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">手动</span>' : '<span class="ml-2 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">自动</span>';
        const div = document.createElement('div');
        div.className = 'p-4 border-b border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors history-item';
        div.innerHTML = `<div class="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center">${timeStr} ${badge}</div><div class="text-xs text-gray-500 mt-1.5 truncate">${item.content.length} 字符 | ${escapeHtml(item.content.substring(0, 30))}...</div>`;
        div.onclick = () => {
            document.querySelectorAll('.history-item').forEach(el => el.classList.remove('bg-purple-50', 'dark:bg-slate-700', 'border-l-4', 'border-purple-500'));
            div.classList.add('bg-purple-50', 'dark:bg-slate-700', 'border-l-4', 'border-purple-500');
            document.getElementById('history-preview').value = item.content; selectedHistoryContent = item.content; document.getElementById('btn-restore-history').disabled = false;
        };
        listEl.appendChild(div);
    });
}

document.getElementById('btn-restore-history').addEventListener('click', () => {
    if (selectedHistoryContent !== null) {
        reqConfirm("危险覆盖", "回退将覆盖当前内容！建议先打一次快照。", () => {
            setEditorValue(selectedHistoryContent); closeHistoryModal(); updatePreview(); forceSave(true); showToast("穿越成功", "success");
        });
    }
});

function reqClearEditor() { reqConfirm("清空内容", "确定清空吗？", () => { setEditorValue(''); updatePreview(); forceSave(true); window.cmView.focus(); }); }
function reqResetEditor() { reqConfirm("重置文档", "恢复至系统默认指引文档？", () => { setEditorValue(defaultMarkdown); updatePreview(); forceSave(true); window.cmView.focus(); }); }

function initDraggableSplitters() {
    const mainResizer = document.getElementById('main-resizer'); const editorPane = document.getElementById('editor-pane'); const previewContainer = document.getElementById('preview-container'); const mainWorkspace = document.getElementById('main-workspace'); 
    let isMainResizing = false; let mainRafId = null;
    mainResizer.addEventListener('mousedown', (e) => { isMainResizing = true; document.body.style.cursor = 'col-resize'; document.body.classList.add('select-none'); editorPane.style.pointerEvents = 'none'; previewContainer.style.pointerEvents = 'none'; e.preventDefault(); });
    
    const tocResizer = document.getElementById('toc-resizer'); const tocPane = document.getElementById('toc-pane');
    let isTocResizing = false; let tocRafId = null;
    if (tocResizer) { tocResizer.addEventListener('mousedown', (e) => { isTocResizing = true; document.body.style.cursor = 'col-resize'; document.body.classList.add('select-none'); tocPane.style.pointerEvents = 'none'; editorPane.style.pointerEvents = 'none'; e.preventDefault(); }); }

    document.addEventListener('mousemove', (e) => {
        if (isMainResizing) {
            if (mainRafId) cancelAnimationFrame(mainRafId);
            mainRafId = requestAnimationFrame(() => {
                const wsRect = mainWorkspace.getBoundingClientRect(); const tocRect = tocPane.getBoundingClientRect();
                const tocWidth = tocPane.classList.contains('hidden') ? 0 : tocRect.width; const tocResizerWidth = tocPane.classList.contains('hidden') ? 0 : tocResizer.offsetWidth;
                const availableWidth = wsRect.width - tocWidth - tocResizerWidth - mainResizer.offsetWidth;
                let newWidthPx = e.clientX - (wsRect.left + tocWidth + tocResizerWidth); let newWidthPercent = (newWidthPx / availableWidth) * 100;
                if (newWidthPercent < 15) newWidthPercent = 15; if (newWidthPercent > 85) newWidthPercent = 85;
                editorPane.style.width = `${newWidthPercent}%`; editorPane.style.flex = `0 0 ${newWidthPercent}%`; editorPane.style.maxWidth = `${newWidthPercent}%`;
            });
        }
        if (isTocResizing) {
            if (tocRafId) cancelAnimationFrame(tocRafId);
            tocRafId = requestAnimationFrame(() => {
                const wsRect = mainWorkspace.getBoundingClientRect(); let newWidth = e.clientX - wsRect.left;
                if (newWidth < 150) newWidth = 150; if (newWidth > 400) newWidth = 400;
                tocPane.style.width = `${newWidth}px`; tocPane.style.flex = `0 0 ${newWidth}px`; tocPane.style.maxWidth = `${newWidth}px`;
            });
        }
    });
    document.addEventListener('mouseup', () => { 
        if (isMainResizing || isTocResizing) { 
            isMainResizing = false; isTocResizing = false; document.body.style.cursor = ''; document.body.classList.remove('select-none');
            editorPane.style.pointerEvents = ''; previewContainer.style.pointerEvents = ''; tocPane.style.pointerEvents = '';
            if (window.cmView) window.cmView.requestMeasure(); 
        } 
    });
}

function bindProductivityEvents() {
    window.cmView.dom.addEventListener('paste', (e) => { const items = (e.clipboardData || e.originalEvent.clipboardData).items; for (let item of items) { if (item.type.indexOf('image') === 0) { e.preventDefault(); processImageFile(item.getAsFile()); break; } } });
    window.cmView.dom.addEventListener('drop', (e) => { const files = e.dataTransfer.files; if (files && files.length > 0) { e.preventDefault(); if (files[0].type.startsWith('image/')) { processImageFile(files[0]); } else { handleFileUpload({ target: { files: files } }); } } });
}

function processImageFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result; const insertText = `\n![${file.name || '图片'}](${base64})\n`;
        if(window.cmView) {
            const sel = window.cmView.state.selection.main;
            window.cmView.dispatch({ changes: {from: sel.from, to: sel.to, insert: insertText}, selection: {anchor: sel.from + insertText.length} });
            window.cmView.focus(); forceSave(true); updatePreview(); showToast("图片已插入", "success");
        }
    };
    reader.readAsDataURL(file);
}

function updateModalOutputs() {
    const mdText = document.getElementById('modal-md-input').value; const tempDiv = document.createElement('div');
    processMarkdownWithMathAndCharts(mdText, tempDiv);
    document.getElementById('output-plain').value = tempDiv.innerText || tempDiv.textContent;
    document.getElementById('output-rich').innerHTML = tempDiv.innerHTML;
    document.getElementById('output-html').value = tempDiv.innerHTML.trim().replace(/></g, '>\n<');
}
function openConverterModal() { document.getElementById('modal-md-input').value = getEditorValue(); updateModalOutputs(); switchTab('tab-plain'); document.getElementById('converter-modal').classList.remove('hidden'); }
function closeConverterModal() { document.getElementById('converter-modal').classList.add('hidden'); }
function switchTab(tabId) {
    ['tab-plain', 'tab-rich', 'tab-html'].forEach(id => document.getElementById(id).classList.add('hidden'));
    ['btn-tab-plain', 'btn-tab-rich', 'btn-tab-html'].forEach(id => { const btn = document.getElementById(id); btn.classList.remove('border-blue-600', 'text-blue-600'); btn.classList.add('border-transparent', 'text-gray-500'); });
    document.getElementById(tabId).classList.remove('hidden'); const activeBtn = document.getElementById(`btn-${tabId}`); activeBtn.classList.remove('border-transparent', 'text-gray-500'); activeBtn.classList.add('border-blue-600', 'text-blue-600');
}

async function loadLib(url, globalVar) {
    if (window[globalVar]) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`加载失败: ${url}`));
        document.body.appendChild(script);
    });
}

async function exportPDF() { 
    showToast("正在渲染智能排版 PDF，请稍候...", "info");
    try {
        await loadLib('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas');
        await loadLib('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', 'html2pdf');
        
        const container = await createExportContainer(false);
        const innerDiv = container.firstChild;
        
        const style = document.createElement('style');
        style.innerHTML = `
            img, pre, blockquote, table, tr, .mermaid, details { page-break-inside: avoid; break-inside: avoid; }
            h1, h2, h3, h4, h5 { page-break-after: avoid; break-after: avoid; }
        `;
        innerDiv.appendChild(style);

        const opt = {
            margin:       [15, 0, 15, 0],
            filename:     'Fly文档.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        await html2pdf().set(opt).from(innerDiv).save();
        if (document.body.contains(container)) document.body.removeChild(container);
        showToast("PDF 导出成功！", "success");
    } catch(e) {
        showToast("生成 PDF 失败", "error");
    }
}

function encodeNonAscii(str) {
    return str.replace(/[\u0080-\uFFFF]/g, match => '&#' + match.charCodeAt(0) + ';');
}

async function exportWord() { 
    showToast("正在生成精排 Word (docx) 文档...", "info");
    try {
        await loadLib('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas');
        await loadLib('https://unpkg.com/html-docx-js@0.3.1/dist/html-docx.js', 'htmlDocx');
        
        const container = await createExportContainer(true);
        const htmlContent = container.firstChild.innerHTML;
        document.body.removeChild(container);

        const wordStyles = `
            body { font-family: 'Microsoft YaHei', 'SimSun', sans-serif; font-size: 11pt; line-height: 1.6; color: #000; }
            h1 { font-size: 20pt; font-weight: bold; margin-top: 24pt; margin-bottom: 12pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 6pt; color: #1e293b; text-align: center; }
            h2 { font-size: 16pt; font-weight: bold; margin-top: 20pt; margin-bottom: 10pt; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt; }
            h3 { font-size: 14pt; font-weight: bold; margin-top: 16pt; margin-bottom: 8pt; color: #1e293b; }
            h4, h5, h6 { font-size: 12pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; color: #1e293b; }
            p { margin-top: 0; margin-bottom: 12pt; text-align: justify; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 14pt; border: 1px solid #cbd5e1; }
            th, td { border: 1px solid #cbd5e1; padding: 8pt 10pt; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            blockquote { border-left: 4px solid #cbd5e1; padding-left: 12pt; color: #475569; margin-left: 0; background-color: #f8fafc; padding: 10pt; }
            ul, ol { margin-bottom: 12pt; padding-left: 24pt; }
            li { margin-bottom: 6pt; }
            a { color: #2563eb; text-decoration: underline; }
            img { max-width: 100%; height: auto; }
        `;
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Document</title><style>${wordStyles}</style></head><body>${htmlContent}</body></html>`; 
        
        try {
            const encodedHtml = encodeNonAscii(fullHtml);
            const converted = window.htmlDocx.asBlob(encodedHtml, {
                orientation: 'portrait',
                margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 } 
            });
            downloadFile(converted, 'Fly文档.docx'); 
            showToast("Word (.docx) 导出成功", "success"); 
        } catch(err) {
            downloadFile(new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' }), 'Fly文档.doc'); 
            showToast("已启用备用 .doc 模式导出", "warning");
        }
    } catch(e) {
        showToast("Word 高级排版引擎加载失败", "error");
    }
}

async function exportImage() {
    showToast("正在渲染超清长图，请稍候...", "info");
    try {
        await loadLib('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas');
        const container = await createExportContainer(false);
        
        const canvas = await html2canvas(container.firstChild, { 
            scale: window.devicePixelRatio || 2, 
            useCORS: true, 
            backgroundColor: '#ffffff', 
            logging: false 
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        downloadFile(imgData, '文档长图.png');
        if (document.body.contains(container)) document.body.removeChild(container);
        showToast("长图导出成功！", "success");
    } catch(err) {
        showToast("长图生成失败", "error");
    }
}

async function exportHTML() { 
    showToast("正在导出自给自足的独立精美网页...", "info");
    try {
        await loadLib('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas');
        const container = await createExportContainer(false);
        const htmlContent = container.firstChild.innerHTML;
        document.body.removeChild(container);

        const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Export</title>
    <script src="https://cdn.tailwindcss.com?plugins=typography"><\/script>
    <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css\">
    <link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css\">
    <style>
        body { 
            background-color: #f1f5f9; 
            padding: 3rem 1rem; 
            display: flex; 
            justify-content: center; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #334155;
            margin: 0;
        }
        .export-wrapper { 
            background-color: #ffffff; 
            padding: 3.5rem 4rem; 
            border-radius: 12px; 
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); 
            width: 100%; 
            max-width: 768px;
            border: 1px solid #e2e8f0;
        }
        .export-wrapper img { margin: 1.5rem auto; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .export-wrapper table { margin-top: 1.5rem; margin-bottom: 1.5rem; }
        .export-wrapper pre { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
        .export-wrapper blockquote { background-color: #f8fafc; border-left-color: #cbd5e1; padding: 1rem; border-radius: 0 8px 8px 0; }
        @media (max-width: 768px) { 
            body { padding: 0; background-color: #fff; } 
            .export-wrapper { padding: 1.5rem; border-radius: 0; box-shadow: none; border: none; } 
        }
    </style>
</head>
<body>
    <main class="export-wrapper prose prose-slate max-w-none break-words">
        ${htmlContent}
    </main>
</body>
</html>`; 
        
        downloadFile(new Blob([fullHtml], { type: 'text/html;charset=utf-8' }), 'Fly网页文档.html'); 
        showToast("HTML 独立网页导出成功", "success"); 
    } catch(e) {
        showToast("HTML 导出失败", "error");
    }
}

function downloadFile(content, fileName, mimeType = null) { try { const a = document.createElement('a'); let url; let isDataUrl = false; if (content instanceof Blob) { url = URL.createObjectURL(content); } else if (typeof content === 'string' && content.startsWith('data:')) { url = content; isDataUrl = true; } else { url = URL.createObjectURL(new Blob([content], { type: mimeType })); } a.style.display = 'none'; a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); setTimeout(() => { if (document.body.contains(a)) document.body.removeChild(a); if (!isDataUrl) URL.revokeObjectURL(url); }, 100); } catch (err) { showToast("下载失败", "error"); } }

function showToast(message, type = 'info') { 
    const container = document.getElementById('toast-container'); 
    const toast = document.createElement('div'); 
    let bgClass = type === 'success' ? "bg-emerald-600 dark:bg-emerald-700" : type === 'error' ? "bg-red-600 dark:bg-red-700" : type === 'warning' ? "bg-yellow-500 dark:bg-yellow-600" : "bg-gray-800 dark:bg-slate-700"; 
    let iconClass = type === 'success' ? "fa-circle-check text-white" : type === 'error' ? "fa-circle-xmark text-white" : type === 'warning' ? "fa-triangle-exclamation text-white" : "fa-circle-info text-blue-400"; 
    toast.className = `${bgClass} text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 min-w-[250px] toast-enter-active`; 
    toast.innerHTML = `<i class="fa-solid ${iconClass} text-lg"></i><span class="text-sm font-medium">${message}</span>`; 
    container.appendChild(toast); 
    setTimeout(() => { 
        toast.classList.remove('toast-enter-active'); 
        toast.classList.add('toast-leave-active'); 
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300); 
    }, 3000); 
}

function handleFileUpload(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { setEditorValue(e.target.result); updatePreview(); forceSave(true); showToast("文件导入成功", "success"); }; reader.readAsText(file); event.target.value = ''; }
async function pasteContent() {
    try { 
        const text = await navigator.clipboard.readText(); 
        if(text && window.cmView) {
            const sel = window.cmView.state.selection.main;
            window.cmView.dispatch({ changes: {from: sel.from, to: sel.to, insert: text}, selection: {anchor: sel.from + text.length} });
            showToast("粘贴成功", "success");
        } 
    } 
    catch (err) { showToast("浏览器可能未授权剪贴板读取，请直接使用 Ctrl+V", "warning"); }
    if(window.cmView) window.cmView.focus();
}

function downloadMD() { const content = getEditorValue(); if (!content || !content.trim()) return showToast("当前文档为空，无内容可下载", "warning"); const activeFile = currentStorageMode === 'local' ? localFiles.find(f => f.id === activeFileId) : browserFiles.find(f => f.id === activeFileId); const fileName = activeFile ? activeFile.name : 'export.md'; downloadFile(new Blob([content], { type: 'text/markdown;charset=utf-8' }), fileName); showToast("Markdown 源码下载成功", "success"); }
async function copyMD() { const content = getEditorValue(); if (!content || !content.trim()) return showToast("当前文档为空，无内容可复制", "warning"); try { await navigator.clipboard.writeText(content); showToast("源码已复制到剪贴板", "success"); } catch (err) { const textArea = document.createElement("textarea"); textArea.value = content; document.body.appendChild(textArea); textArea.select(); document.execCommand("copy"); document.body.removeChild(textArea); showToast("源码已复制到剪贴板", "success"); } }

function setMode(mode) {
    const workspace = document.getElementById('main-workspace'); const btnSplit = document.getElementById('btn-split'); const btnPreview = document.getElementById('btn-preview');
    if (mode === 'preview') { workspace.classList.add('is-preview-mode'); btnPreview.className = "px-4 py-1.5 rounded bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 transition-all flex items-center gap-1.5 text-sm font-medium"; btnSplit.className = "px-4 py-1.5 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 text-sm font-medium"; } 
    else { workspace.classList.remove('is-preview-mode'); btnSplit.className = "px-4 py-1.5 rounded bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 transition-all flex items-center gap-1.5 text-sm font-medium"; btnPreview.className = "px-4 py-1.5 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 text-sm font-medium"; }
    setTimeout(() => { if (window.cmView) window.cmView.requestMeasure(); }, 350);
}

function toggleDarkMode() {
    const html = document.documentElement; const themeIcon = document.getElementById('theme-icon');
    const isDarkNow = html.classList.contains('dark');
    if (isDarkNow) {
        html.classList.remove('dark'); localStorage.setItem(THEME_KEY, 'light'); themeIcon.className = 'fa-solid fa-moon text-indigo-500 text-base';
        if (window.cmView) window.cmView.dispatch({ effects: themeConfig.reconfigure([syntaxHighlighting(customLightHighlight)]) }); 
        if (window.mermaid) window.mermaid.initialize({ theme: 'default', gantt:{useWidth: 800} });
    } else {
        html.classList.add('dark'); localStorage.setItem(THEME_KEY, 'dark'); themeIcon.className = 'fa-solid fa-sun text-yellow-400 text-base';
        if (window.cmView) window.cmView.dispatch({ effects: themeConfig.reconfigure([oneDark]) }); 
        if (window.mermaid) window.mermaid.initialize({ theme: 'dark', gantt:{useWidth: 800} });
    }
    updatePreview(); 
}

function toggleFullScreen() { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => { showToast("无法进入全屏: " + err.message, "error"); }); } else { document.exitFullscreen(); } }

function insertFormat(type) {
    if (!window.cmView) return;
    const state = window.cmView.state;
    let start = "", end = "";

    switch(type) {
        case 'bold': start = "**"; end = "**"; break;
        case 'italic': start = "*"; end = "*"; break;
        case 'underline': start = "<u>"; end = "</u>"; break;
        case 'strike': start = "~~"; end = "~~"; break;
        case 'mark': start = "=="; end = "=="; break;
        case 'inline-code': start = "`"; end = "`"; break;
        case 'math-inline': start = "$"; end = "$"; break;
        case 'math-block': start = "\n$$\n"; end = "\n$$\n"; break;
        case 'h1': start = "# "; end = ""; break;
        case 'h2': start = "## "; end = ""; break;
        case 'h3': start = "### "; end = ""; break;
        case 'h4': start = "#### "; end = ""; break;
        case 'ul': start = "- "; end = ""; break;
        case 'ol': start = "1. "; end = ""; break;
        case 'task': start = "- [ ] "; end = ""; break;
        case 'quote': start = "> "; end = ""; break;
        case 'code-block': start = "\n```\n"; end = "\n```\n"; break;
        case 'mermaid': start = "\n```mermaid\ngraph TD;\n    A-->B;\n```\n"; end = ""; break;
        case 'details': start = "\n<details class=\"bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-lg shadow-sm my-4\">\n<summary class=\"font-bold cursor-pointer outline-none select-none text-blue-600 dark:text-blue-400\">💡 点击展开/折叠 内容块</summary>\n\n"; end = "\n\n</details>\n"; break;
        case 'hr': start = "\n---\n"; end = ""; break;
        case 'link': start = "["; end = "](url)"; break;
        case 'image': start = "!["; end = "](url)"; break;
        case 'table': start = "\n| 列 1 | 列 2 |\n| :--- | :--- |\n| 数据 | 数据 |\n"; end = ""; break;
    }

    const changes = state.changeByRange(range => {
        if (['hr', 'table', 'mermaid', 'details'].includes(type)) {
            return {
                changes: { from: range.from, to: range.to, insert: start + end },
                range: EditorSelection.cursor(range.from + start.length)
            };
        }

        const selectedText = state.sliceDoc(range.from, range.to);
        const isLinkOrImg = ['link', 'image'].includes(type);
        const textToInsert = selectedText ? (start + selectedText + end) : (start + (isLinkOrImg ? '文本' : '') + end);
        
        return {
            changes: { from: range.from, to: range.to, insert: textToInsert },
            range: EditorSelection.cursor(range.from + start.length + (selectedText ? selectedText.length : (isLinkOrImg ? 2 : 0)))
        };
    });

    window.cmView.dispatch(changes);
    window.cmView.focus();
    updatePreview();
}

window.addEventListener('DOMContentLoaded', init);
