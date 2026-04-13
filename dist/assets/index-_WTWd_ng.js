//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region src/main.js
var currentFileId = null;
var storageMode = "browser";
var isDarkMode = false;
function initApp() {
	initDarkMode();
	initEditor();
	initFileList();
	initEventListeners();
	loadDefaultContent();
}
function initDarkMode() {
	isDarkMode = localStorage.getItem("darkMode") === "true";
	if (isDarkMode) {
		document.documentElement.classList.add("dark");
		document.getElementById("theme-icon").className = "fa-solid fa-sun text-yellow-400 text-base";
	}
}
function initEditor() {
	const editorContainer = document.getElementById("editor-container");
	const textarea = document.createElement("textarea");
	textarea.className = "w-full h-full p-4 font-mono text-sm bg-transparent text-gray-800 dark:text-gray-200 resize-none outline-none";
	textarea.placeholder = "在此输入 Markdown...";
	editorContainer.appendChild(textarea);
	window.editor = {
		state: {
			doc: {
				toString: () => textarea.value,
				length: textarea.value.length,
				lines: textarea.value.split("\n").length
			},
			selection: {
				from: 0,
				to: 0
			}
		},
		dispatch: (update) => {
			if (update.changes) textarea.value = update.changes.insert;
		}
	};
	textarea.addEventListener("input", () => {
		updatePreview();
		updateCharCount();
		saveFile();
	});
	loadDefaultContent();
}
function initFileList() {
	renderFileList();
}
function initEventListeners() {
	document.addEventListener("keydown", (e) => {
		if (e.ctrlKey && e.key === "b") {
			e.preventDefault();
			insertFormat("bold");
		}
		if (e.ctrlKey && e.key === "i") {
			e.preventDefault();
			insertFormat("italic");
		}
		if (e.ctrlKey && e.key === "k") {
			e.preventDefault();
			insertFormat("link");
		}
		if (e.ctrlKey && e.key === "e") {
			e.preventDefault();
			insertFormat("inline-code");
		}
		if (e.ctrlKey && e.key === "f") {
			e.preventDefault();
			toggleCustomSearch();
		}
	});
	window.addEventListener("resize", () => {
		updateEditorHeight();
	});
}
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
	if (window.editor) window.editor.dispatch({ changes: {
		from: 0,
		to: window.editor.state.doc.length,
		insert: defaultContent
	} });
}
function updatePreview() {
	if (!window.editor) return;
	const markdown = window.editor.state.doc.toString();
	const previewEl = document.getElementById("preview");
	marked.setOptions({
		renderer: new marked.Renderer(),
		highlight: function(code, lang) {
			const language = hljs.getLanguage(lang) ? lang : "plaintext";
			return hljs.highlight(code, { language }).value;
		},
		langPrefix: "hljs language-",
		breaks: true,
		gfm: true,
		headerIds: true,
		mangle: false,
		smartypants: false
	});
	marked.use(markedFootnote);
	let html = marked.parse(markdown);
	html = DOMPurify.sanitize(html);
	html = renderMathInElement(html);
	html = renderMermaidInElement(html);
	html = renderEChartsInElement(html);
	previewEl.innerHTML = html;
	updateTOC();
	handleTaskList();
}
function renderMathInElement(html) {
	return html;
}
function renderMermaidInElement(html) {
	return html;
}
function renderEChartsInElement(html) {
	return html;
}
function updateTOC() {
	const previewEl = document.getElementById("preview");
	const tocListEl = document.getElementById("toc-list");
	const headings = previewEl.querySelectorAll("h1, h2, h3, h4, h5, h6");
	let tocHTML = "";
	headings.forEach((heading, index) => {
		const id = `heading-${index}`;
		heading.id = id;
		const indent = (parseInt(heading.tagName.substring(1)) - 1) * 16;
		tocHTML += `<div style="margin-left: ${indent}px;" class="toc-item">
            <a href="#${id}" class="block py-1 px-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                ${heading.textContent}
            </a>
        </div>`;
	});
	tocListEl.innerHTML = tocHTML;
}
function handleTaskList() {
	document.getElementById("preview").querySelectorAll("input[type=\"checkbox\"]").forEach((checkbox) => {
		checkbox.addEventListener("change", function() {});
	});
}
function updateCharCount() {
	if (!window.editor) return;
	const doc = window.editor.state.doc;
	const lines = doc.lines;
	const chars = doc.length;
	document.getElementById("char-count").textContent = `${lines} 行 | ${chars} 字符`;
}
function saveFile() {
	if (!window.editor || true) return;
	const content = window.editor.state.doc.toString();
	if (storageMode === "browser") {
		const files = JSON.parse(localStorage.getItem("markdownFiles") || "{}");
		files[currentFileId] = {
			content,
			lastModified: (/* @__PURE__ */ new Date()).toISOString()
		};
		localStorage.setItem("markdownFiles", JSON.stringify(files));
	}
	const saveStatus = document.getElementById("save-status");
	saveStatus.textContent = "已保存";
	setTimeout(() => {
		saveStatus.textContent = "已保存";
	}, 1e3);
}
function renderFileList() {
	const fileListEl = document.getElementById("file-list");
	const searchInput = document.getElementById("file-search-input").value.toLowerCase();
	let files = {};
	if (storageMode === "browser") files = JSON.parse(localStorage.getItem("markdownFiles") || "{}");
	let fileHTML = "";
	Object.entries(files).forEach(([id, file]) => {
		const fileName = id;
		if (searchInput && !fileName.toLowerCase().includes(searchInput)) return;
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
	if (Object.keys(files).length === 0) fileHTML = `<div class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
            <i class="fa-solid fa-folder-open text-4xl mb-3"></i>
            <p>暂无文件</p>
            <p class="text-xs mt-1">点击右上角 "新建文件" 开始</p>
        </div>`;
	fileListEl.innerHTML = fileHTML;
}
function toggleCustomSearch() {
	const searchPanel = document.getElementById("custom-search-panel");
	searchPanel.classList.toggle("hidden");
	if (!searchPanel.classList.contains("hidden")) document.getElementById("find-input").focus();
}
function insertFormat(type) {
	if (!window.editor) return;
	const selection = window.editor.state.selection;
	const selectedText = window.editor.state.doc.sliceString(selection.from, selection.to);
	let insertedText = "";
	switch (type) {
		case "bold":
			insertedText = `**${selectedText}**`;
			break;
		case "italic":
			insertedText = `*${selectedText}*`;
			break;
		case "underline":
			insertedText = `<u>${selectedText}</u>`;
			break;
		case "strike":
			insertedText = `~~${selectedText}~~`;
			break;
		case "mark":
			insertedText = `<mark>${selectedText}</mark>`;
			break;
		case "inline-code":
			insertedText = `\`${selectedText}\``;
			break;
		case "h1":
			insertedText = `# ${selectedText}`;
			break;
		case "h2":
			insertedText = `## ${selectedText}`;
			break;
		case "h3":
			insertedText = `### ${selectedText}`;
			break;
		case "h4":
			insertedText = `#### ${selectedText}`;
			break;
		case "ul":
			insertedText = `- ${selectedText}`;
			break;
		case "ol":
			insertedText = `1. ${selectedText}`;
			break;
		case "task":
			insertedText = `- [ ] ${selectedText}`;
			break;
		case "quote":
			insertedText = `> ${selectedText}`;
			break;
		case "code-block":
			insertedText = `\`\`\`javascript\n${selectedText}\n\`\`\``;
			break;
		case "table":
			insertedText = `| 表头1 | 表头2 |\n| --- | --- |\n| 内容1 | 内容2 |`;
			break;
		case "details":
			insertedText = `<details>\n<summary>标题</summary>\n${selectedText}\n</details>`;
			break;
		case "math-inline":
			insertedText = `$${selectedText}$`;
			break;
		case "math-block":
			insertedText = `$$\n${selectedText}\n$$`;
			break;
		case "mermaid":
			insertedText = `\`\`\`mermaid\ngraph TD\n  A[开始] --> B[处理]\n  B --> C[结束]\n\`\`\``;
			break;
		case "link":
			insertedText = `[${selectedText || "链接文本"}](https://example.com)`;
			break;
		case "image":
			insertedText = `![${selectedText || "图片描述"}](https://via.placeholder.com/300)`;
			break;
		case "hr":
			insertedText = `---`;
			break;
	}
	window.editor.dispatch({
		changes: {
			from: selection.from,
			to: selection.to,
			insert: insertedText
		},
		selection: { anchor: selection.from + insertedText.length }
	});
}
function updateEditorHeight() {}
window.addEventListener("DOMContentLoaded", initApp);
//#endregion
