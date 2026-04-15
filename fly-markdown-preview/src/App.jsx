import React, { useState, useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { renderMarkdown, renderMermaid, renderECharts, getFormattedText, downloadMD, copyToClipboard, generateTOC } from './utils/markdownUtils';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [mode, setMode] = useState('split'); // split, preview
  const [showTOC, setShowTOC] = useState(false);
  const [showFileSidebar, setShowFileSidebar] = useState(true);
  const [currentFile, setCurrentFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [markdownContent, setMarkdownContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  
  const editorContainerRef = useRef(null);
  const previewRef = useRef(null);
  const editorViewRef = useRef(null);

  // 初始化CodeMirror编辑器
  useEffect(() => {
    if (editorContainerRef.current) {
      const startState = EditorState.create({
        doc: markdownContent,
        extensions: [
          lineNumbers(),
          keymap.of(defaultKeymap),
          markdown(),
          oneDark.of({ dark: darkMode }),
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              const newContent = update.state.doc.toString();
              setMarkdownContent(newContent);
              updatePreview(newContent);
            }
          })
        ]
      });

      const view = new EditorView({
        state: startState,
        parent: editorContainerRef.current
      });

      editorViewRef.current = view;

      return () => {
        view.destroy();
      };
    }
  }, [darkMode]);

  // 监听markdown内容变化，更新预览
  useEffect(() => {
    updatePreview(markdownContent);
  }, [markdownContent]);

  // 处理暗黑模式
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 更新预览内容
  const updatePreview = (content) => {
    const html = renderMarkdown(content);
    setPreviewContent(html);

    // 延迟执行mermaid和echarts渲染
    setTimeout(() => {
      renderMermaid(previewRef.current);
      renderECharts(previewRef.current);
    }, 100);
  };



  // 切换暗黑模式
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // 设置模式（分屏/预览）
  const setModeHandler = (newMode) => {
    setMode(newMode);
  };

  // 切换大纲显示
  const toggleTOC = () => {
    setShowTOC(!showTOC);
  };

  // 切换文件侧边栏
  const toggleFileSidebar = () => {
    setShowFileSidebar(!showFileSidebar);
  };

  // 处理文件上传
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setMarkdownContent(content);
        if (editorViewRef.current) {
          editorViewRef.current.dispatch({
            changes: {
              from: 0,
              to: editorViewRef.current.state.doc.length,
              insert: content
            }
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // 下载MD文件
  const downloadMDHandler = () => {
    downloadMD(markdownContent);
  };

  // 复制MD内容
  const copyMDHandler = () => {
    copyToClipboard(markdownContent);
  };

  // 清空编辑器
  const clearEditor = () => {
    setMarkdownContent('');
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: ''
        }
      });
    }
  };

  // 重置编辑器
  const resetEditor = () => {
    const defaultContent = `# Fly Markdown 实时预览器

欢迎使用 Fly Markdown 实时预览器！这是一个功能强大的 Markdown 编辑器，支持实时预览、暗黑模式、代码高亮、数学公式、图表等功能。

## 功能特性

- ✅ 实时预览
- ✅ 暗黑模式
- ✅ 代码高亮
- ✅ 数学公式（KaTeX）
- ✅ Mermaid 图表
- ✅ ECharts 图表
- ✅ 任务列表
- ✅ 脚注
- ✅ 表格
- ✅ 代码块

## 快捷键

- **Ctrl+B**: 加粗
- **Ctrl+I**: 斜体
- **Ctrl+K**: 超链接
- **Ctrl+E**: 行内代码

## 示例

### 代码块

\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`

### 数学公式

行内公式：$E=mc^2$

块级公式：

$$
\int_0^1 x^2 dx = \frac{1}{3}
$$

### Mermaid 图表

\`\`\`mermaid
graph TD
  A[开始] --> B[处理]
  B --> C{条件}
  C -->|是| D[结果1]
  C -->|否| E[结果2]
  D --> F[结束]
  E --> F
\`\`\`

### ECharts 图表

\`\`\`echarts
{
  title: {
    text: '示例图表'
  },
  tooltip: {},
  xAxis: {
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  yAxis: {},
  series: [{
    name: '销量',
    type: 'bar',
    data: [5, 20, 36, 10, 10, 20, 5]
  }]
}
\`\`\`
`;
    setMarkdownContent(defaultContent);
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: defaultContent
        }
      });
    }
  };

  // 切换全屏
  const toggleFullScreen = () => {
    const elem = document.getElementById('app-container');
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 插入格式化内容
  const insertFormat = (format) => {
    if (!editorViewRef.current) return;

    const view = editorViewRef.current;
    const selection = view.state.selection;
    const selectedText = view.state.doc.sliceString(selection.from, selection.to);

    const insertText = getFormattedText(format, selectedText);

    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: insertText
      },
      selection: {
        anchor: selection.from + insertText.length
      }
    });
  };

  return (
    <div className="flex flex-col items-center w-full h-screen">
      {/* 头部 */}
      <div className="flex items-center justify-center py-3 shrink-0 px-2 lg:px-0 w-full">
        <i className="fa-brands fa-markdown text-blue-600 dark:text-blue-400 text-3xl mr-3"></i>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Fly Markdown 实时预览器</h1>
      </div>

      {/* 主容器 */}
      <div id="app-container" className="flex flex-row gap-3 md:gap-4 w-full max-w-[1600px] flex-1 min-h-[600px] mb-2 px-2 md:px-0 relative h-[calc(100vh-80px)]">
        {/* 左侧文件管理 */}
        {showFileSidebar ? (
          <aside id="file-sidebar" className="w-56 lg:w-64 flex flex-col bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl shadow-xl shrink-0 z-40 relative h-full overflow-hidden transition-all duration-300">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 shrink-0 flex justify-between items-center bg-gray-100 dark:bg-slate-900 h-[55px]">
              <span className="text-base font-bold text-gray-700 dark:text-gray-300"><i className="fa-solid fa-folder-tree text-orange-500 mr-1.5"></i> 资源库</span>
              <div className="flex gap-2">
                <button className="text-gray-500 hover:text-yellow-600 transition" title="根目录新建文件夹"><i className="fa-solid fa-folder-plus text-base"></i></button>
                <button className="text-gray-500 hover:text-green-500 transition" title="根目录新建文件"><i className="fa-solid fa-plus text-base"></i></button>
                <button onClick={toggleFileSidebar} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition" title="向左隐藏"><i className="fa-solid fa-chevron-left text-base"></i></button>
              </div>
            </div>
            
            <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex gap-1 relative z-10 shrink-0">
              <button className="flex-1 py-1.5 text-xs rounded-md bg-blue-100 text-blue-700 dark:bg-slate-700 dark:text-blue-400 font-bold transition shadow-sm border border-blue-200 dark:border-slate-600"><i className="fa-solid fa-window-maximize mr-1"></i>浏览器缓存</button>
              <button className="flex-1 py-1.5 text-xs rounded-md text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-800 transition border border-transparent hover:border-gray-300 dark:hover:border-slate-600"><i className="fa-solid fa-hard-drive mr-1"></i>本地直连</button>
            </div>
            
            <div className="p-2 border-b border-gray-200 dark:border-slate-700 shrink-0">
              <div className="relative">
                <i className="fa-solid fa-search absolute left-2.5 top-2 text-gray-400 text-sm"></i>
                <input type="text" placeholder="搜索文件..." className="w-full text-sm pl-8 pr-2 py-1.5 rounded bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <div id="file-list" className="flex-1 overflow-y-auto py-2 space-y-0.5 text-sm pb-10">
              {/* 文件列表将通过状态管理 */}
            </div>
          </aside>
        ) : (
          <aside id="file-sidebar-collapsed" className="w-16 flex flex-col bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl shadow-xl shrink-0 z-40 transition-all duration-300 items-center py-4 h-fit self-start">
            <button onClick={toggleFileSidebar} className="text-gray-500 hover:text-orange-500 transition mb-4" title="展开资源库"><i className="fa-solid fa-folder-tree text-xl"></i></button>
            <div className="w-10 h-px bg-gray-200 dark:bg-slate-700 mb-4"></div>
            <button className="text-gray-500 hover:text-green-500 transition mb-4" title="新建文件"><i className="fa-solid fa-plus text-xl"></i></button>
            <button className="text-gray-500 hover:text-yellow-600 transition" title="新建文件夹"><i className="fa-solid fa-folder-plus text-xl"></i></button>
          </aside>
        )}

        <div className="core-area flex flex-col flex-1 min-w-0 h-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-300 dark:border-slate-700 overflow-hidden">
          {/* 工具栏 */}
          <header className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 z-30 flex flex-col md:flex-row md:items-center px-4 py-2.5 shrink-0 w-full">
            <div className="flex flex-wrap items-center gap-2 w-full">
              <div className="flex bg-white dark:bg-slate-800 rounded p-1 border border-gray-200 dark:border-slate-700 shrink-0 shadow-sm transition-colors">
                <button onClick={() => document.getElementById('file-upload').click()} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="导入内容"><i className="fa-solid fa-file-import text-yellow-600 text-base"></i> <span className="hidden xl:inline font-medium">导入</span></button>
                <input type="file" id="file-upload" accept=".md,.txt" className="hidden" onChange={handleFileUpload} />
                <button className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="粘贴"><i className="fa-solid fa-paste text-blue-500 text-base"></i> <span className="hidden xl:inline font-medium">粘贴</span></button>
                <button onClick={clearEditor} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm" title="清空"><i className="fa-solid fa-trash-can text-base"></i> <span className="hidden lg:inline font-medium">清空</span></button>
                <button onClick={resetEditor} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="重置文档"><i className="fa-solid fa-rotate-right text-green-600 dark:text-green-400 text-base"></i> <span className="hidden lg:inline font-medium">重置</span></button>
                <button className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-purple-600 dark:text-purple-400 border-l border-gray-200 dark:border-slate-600 pl-3 ml-1 text-sm" title="快照时光机"><i className="fa-solid fa-clock-rotate-left text-base"></i> <span className="hidden lg:inline font-medium">时光机</span></button>
              </div>

              <div className="flex bg-white dark:bg-slate-800 rounded p-1 border border-gray-200 dark:border-slate-700 shrink-0 shadow-sm transition-colors">
                <button onClick={downloadMDHandler} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="下载 MD"><i className="fa-solid fa-download text-indigo-500 dark:text-indigo-400 text-base"></i> <span className="hidden lg:inline font-medium">下载 MD</span></button>
                <button onClick={copyMDHandler} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="复制 MD"><i className="fa-regular fa-copy text-gray-600 dark:text-gray-400 text-base"></i> <span className="hidden lg:inline font-medium">复制 MD</span></button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex bg-white dark:bg-slate-800 rounded p-1 border border-gray-200 dark:border-slate-700 select-none shadow-sm transition-colors">
                  <button onClick={() => setModeHandler('split')} className={`px-4 py-1.5 rounded ${mode === 'split' ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'} transition-all flex items-center gap-1.5 text-sm font-medium`} title="分屏"><i className="fa-solid fa-table-columns text-base"></i> <span className="hidden md:inline">分屏</span></button>
                  <button onClick={() => setModeHandler('preview')} className={`px-4 py-1.5 rounded ${mode === 'preview' ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'} transition-all flex items-center gap-1.5 text-sm font-medium`} title="仅预览"><i className="fa-solid fa-desktop text-base"></i> <span className="hidden md:inline">预览</span></button>
                </div>
                <div className="flex bg-white dark:bg-slate-800 rounded p-1 border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
                  <button onClick={toggleTOC} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="开关大纲"><i className="fa-solid fa-list-ul text-teal-600 dark:text-teal-400 text-base"></i> <span className="hidden lg:inline font-medium">大纲</span></button>
                  <button onClick={toggleDarkMode} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="开关夜间模式"><i id="theme-icon" className={`fa-solid ${darkMode ? 'fa-sun text-yellow-400' : 'fa-moon text-indigo-500'} text-base`}></i> <span className="hidden lg:inline font-medium">主题</span></button>
                  <button onClick={toggleFullScreen} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="全屏"><i className="fa-solid fa-expand text-gray-700 dark:text-gray-400 text-base"></i> <span className="hidden lg:inline font-medium">全屏</span></button>
                </div>
              </div>
              <div className="flex-1 hidden md:block"></div>
              <div className="flex gap-2 w-full md:w-auto justify-end">
                <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded shadow-sm transition-all flex items-center gap-1.5 text-sm font-medium shrink-0"><i className="fa-solid fa-exchange-alt"></i> 转换输出</button>
                
                <div className="relative group shrink-0">
                  <button className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white px-4 py-2 rounded shadow-sm transition-all flex items-center gap-1.5 text-sm font-medium"><i className="fa-solid fa-file-export"></i> 更多导出 <i className="fa-solid fa-chevron-down text-xs"></i></button>
                  <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-[100]">
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl py-1 overflow-hidden relative">
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition flex items-center gap-2.5"><i className="fa-solid fa-file-pdf w-4 text-center text-red-500"></i> 高清 PDF</button>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition flex items-center gap-2.5"><i className="fa-solid fa-file-word w-4 text-center text-blue-500"></i> Word (.docx)</button>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition flex items-center gap-2.5"><i className="fa-solid fa-image w-4 text-center text-purple-500"></i> 高清长图 (.png)</button>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition flex items-center gap-2.5"><i className="fa-solid fa-file-code w-4 text-center text-orange-500"></i> HTML 网页</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* 主工作区 */}
          <main id="main-workspace" className={`flex flex-row flex-1 relative bg-white dark:bg-slate-800 items-stretch overflow-hidden w-full h-full ${mode === 'preview' ? 'is-preview-mode' : ''}`}>
            {/* 文档大纲 */}
            {showTOC && (
              <>
                <aside id="toc-pane" className="flex-col bg-gray-50 dark:bg-slate-900 shrink-0 h-full w-[220px]" style={{ flex: '0 0 220px' }}>
                  <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-slate-700 shrink-0 flex justify-between items-center" style={{ height: '44px' }}>
                    <span><i className="fa-solid fa-location-crosshairs mr-1"></i> 文档大纲</span>
                    <button onClick={toggleTOC} className="hover:text-red-500 dark:hover:text-red-400 transition" title="隐藏大纲"><i className="fa-solid fa-xmark text-lg"></i></button>
                  </div>
                  <div id="toc-list" className="p-4 flex-1 overflow-y-auto space-y-1.5 text-sm">
                    {/* 大纲内容将通过状态管理 */}
                  </div>
                </aside>
                <div id="toc-resizer" className="hidden md:flex flex-col justify-center items-center w-2 cursor-col-resize bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors z-20 shrink-0 h-full group">
                  <div className="w-[2px] h-full bg-transparent group-hover:bg-blue-400 transition-colors mx-auto"></div>
                </div>
              </>
            )}

            {/* 编辑器面板 */}
            <div id="editor-pane" className="flex flex-col bg-white dark:bg-slate-800 z-10 shrink-0 min-w-0 relative h-full flex-1" style={{ width: '50%', flex: '0 0 50%' }}>
              <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-gray-200 dark:border-slate-700 shrink-0 z-20" style={{ height: '44px' }}>
                <span id="current-filename-display" className="truncate max-w-[250px] text-sm font-bold text-gray-700 dark:text-gray-200"><i className="fa-solid fa-code text-blue-500 mr-1.5"></i>编辑器</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span id="save-status" className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium transition-colors"><i className="fa-solid fa-check mr-1.5"></i>已保存</span>
                  <span id="char-count" className="hidden md:flex items-center text-xs text-gray-500 dark:text-gray-400">{markdownContent.split('\n').length} 行 | {markdownContent.length} 字符</span>
                  <button className="text-gray-400 hover:text-blue-500 transition ml-2 text-base" title="搜索与替换 (Ctrl+F)"><i className="fa-solid fa-magnifying-glass"></i></button>
                </div>
              </div>
              
              {/* 格式化工具栏 */}
              <div className="bg-gray-50 dark:bg-slate-900 px-3 py-1.5 flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-700 shrink-0 shadow-sm transition-colors z-20 items-center select-none overflow-x-auto">
                {/* 1. 基础文本排版 */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
                  <button onClick={() => insertFormat('bold')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700" title="加粗 (Ctrl+B)"><i className="fa-solid fa-bold text-sm"></i></button>
                  <button onClick={() => insertFormat('italic')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="斜体 (Ctrl+I)"><i className="fa-solid fa-italic text-sm"></i></button>
                  <button onClick={() => insertFormat('underline')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="下划线"><i className="fa-solid fa-underline text-sm"></i></button>
                  <button onClick={() => insertFormat('strike')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="删除线"><i className="fa-solid fa-strikethrough text-sm"></i></button>
                  <button onClick={() => insertFormat('mark')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="高亮标记"><i className="fa-solid fa-highlighter text-sm"></i></button>
                  <button onClick={() => insertFormat('inline-code')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-r" title="行内代码 (Ctrl+E)"><i className="fa-solid fa-terminal text-sm"></i></button>
                </div>

                {/* 2. 标题层级 */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm font-bold shrink-0">
                  <button onClick={() => insertFormat('h1')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700 text-sm" title="一级标题">H1</button>
                  <button onClick={() => insertFormat('h2')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700 text-sm" title="二级标题">H2</button>
                  <button onClick={() => insertFormat('h3')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700 text-sm" title="三级标题">H3</button>
                  <button onClick={() => insertFormat('h4')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-r text-sm" title="四级标题">H4</button>
                </div>

                {/* 3. 列表与引用 */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
                  <button onClick={() => insertFormat('ul')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700" title="无序列表"><i className="fa-solid fa-list-ul text-sm"></i></button>
                  <button onClick={() => insertFormat('ol')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="有序列表"><i className="fa-solid fa-list-ol text-sm"></i></button>
                  <button onClick={() => insertFormat('task')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="任务列表"><i className="fa-solid fa-list-check text-sm"></i></button>
                  <button onClick={() => insertFormat('quote')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-r" title="引用段落"><i className="fa-solid fa-quote-left text-sm"></i></button>
                </div>

                {/* 4. 复杂块与折叠 */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
                  <button onClick={() => insertFormat('code-block')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700" title="代码段"><i className="fa-solid fa-file-code text-sm"></i></button>
                  <button onClick={() => insertFormat('table')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="插入表格"><i className="fa-solid fa-table text-sm"></i></button>
                  <button onClick={() => insertFormat('details')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-r" title="折叠块"><i className="fa-solid fa-layer-group text-sm"></i></button>
                </div>

                {/* 5. 数学公式与图表 */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
                  <button onClick={() => insertFormat('math-inline')} className="w-8 h-7 flex items-center justify-center text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700" title="行内公式"><i className="fa-solid fa-subscript text-sm"></i></button>
                  <button onClick={() => insertFormat('math-block')} className="w-8 h-7 flex items-center justify-center text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="块级公式"><i className="fa-solid fa-square-root-variable text-sm"></i></button>
                  <button onClick={() => insertFormat('mermaid')} className="w-8 h-7 flex items-center justify-center text-pink-600 dark:text-pink-400 hover:text-pink-700 hover:bg-pink-50 dark:hover:bg-slate-700 transition-colors rounded-r" title="Mermaid 图表模板"><i className="fa-solid fa-project-diagram text-sm"></i></button>
                </div>

                {/* 6. 媒体与链接 */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
                  <button onClick={() => insertFormat('link')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700" title="超链接 (Ctrl+K)"><i className="fa-solid fa-link text-sm"></i></button>
                  <button onClick={() => insertFormat('image')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="插入图片 (Ctrl+V)"><i className="fa-regular fa-image text-sm"></i></button>
                  <button onClick={() => insertFormat('hr')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-r" title="分割线"><i className="fa-solid fa-minus text-sm"></i></button>
                </div>

                {/* Help Button */}
                <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
                  <button className="w-8 h-7 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors rounded" title="Markdown 语法与帮助指引"><i className="fa-solid fa-circle-question text-sm"></i></button>
                </div>
              </div>

              {/* 编辑器容器 */}
              <div id="editor-container" ref={editorContainerRef} className="flex-1 w-full overflow-hidden relative h-full text-left"></div>
            </div>

            {/* 分隔器 */}
            <div id="main-resizer" className="hidden md:flex flex-col justify-center items-center w-2 cursor-col-resize bg-gray-50 dark:bg-slate-900 border-x border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors z-20 shrink-0 h-full group">
              <div className="w-[2px] h-full bg-transparent group-hover:bg-blue-400 transition-colors mx-auto"></div>
            </div>

            {/* 预览面板 */}
            <div id="preview-container" className="flex flex-col bg-gray-50 dark:bg-slate-900 z-0 shrink-0 transition-colors flex-1 overflow-hidden h-full min-w-0 relative">
              <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-slate-700 sticky top-0 z-20 shrink-0 flex items-center justify-between" style={{ height: '44px' }}>
                <span><i className="fa-solid fa-eye mr-1.5"></i> 实时预览</span>
              </div>
              <div id="preview-scroller" className="w-full flex-1 overflow-y-auto p-0 md:p-4 lg:p-8 flex justify-center bg-white dark:bg-slate-800">
                <div id="preview-wrapper" className="w-full transition-all duration-300 overflow-x-hidden min-h-full">
                  <div id="preview" ref={previewRef} className="prose dark:prose-invert prose-slate max-w-none break-words px-6 py-6 lg:px-10 pb-20" dangerouslySetInnerHTML={{ __html: previewContent }}></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
