import { useState, useEffect, lazy, Suspense } from 'react';
import { renderMarkdown, downloadMD, copyToClipboard, generateTOC } from './utils/markdownUtils';

// 懒加载组件
const Header = lazy(() => import('./components/Header'));
const FileSidebar = lazy(() => import('./components/FileSidebar'));
const Toolbar = lazy(() => import('./components/Toolbar'));
const TOC = lazy(() => import('./components/TOC'));
const Editor = lazy(() => import('./components/Editor'));
const Preview = lazy(() => import('./components/Preview'));

// 加载占位符
const Loading = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [mode, setMode] = useState('split'); // split, preview
  const [showTOC, setShowTOC] = useState(false);
  const [showFileSidebar, setShowFileSidebar] = useState(true);
  const [markdownContent, setMarkdownContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [headings, setHeadings] = useState([]);

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

  // 初始化默认内容
  useEffect(() => {
    const defaultContent = '# Fly Markdown 实时预览器\n\n欢迎使用 Fly Markdown 实时预览器！这是一个功能强大的 Markdown 编辑器，支持实时预览、暗黑模式、代码高亮、数学公式、图表等功能。\n\n## 功能特性\n\n- ✅ 实时预览\n- ✅ 暗黑模式\n- ✅ 代码高亮\n- ✅ 数学公式（KaTeX）\n- ✅ Mermaid 图表\n- ✅ ECharts 图表\n- ✅ 任务列表\n- ✅ 脚注\n- ✅ 表格\n- ✅ 代码块\n\n## 快捷键\n\n- **Ctrl+B**: 加粗\n- **Ctrl+I**: 斜体\n- **Ctrl+K**: 超链接\n- **Ctrl+E**: 行内代码\n\n## 示例\n\n### 代码块\n\n```javascript\nfunction hello() {\n  console.log(\'Hello, world!\');\n}\n```\n\n### 数学公式\n\n行内公式：$E=mc^2$\n\n块级公式：\n\n$$\n\\int_0^1 x^2 dx = \\frac{1}{3}\n$$\n\n### Mermaid 图表\n\n```mermaid\ngraph TD\n  A[开始] --> B[处理]\n  B --> C{条件}\n  C -->|是| D[结果1]\n  C -->|否| E[结果2]\n  D --> F[结束]\n  E --> F\n```\n\n### ECharts 图表\n\n```echarts\n{\n  title: {\n    text: \'示例图表\'\n  },\n  tooltip: {},\n  xAxis: {\n    data: [\'Mon\', \'Tue\', \'Wed\', \'Thu\', \'Fri\', \'Sat\', \'Sun\']\n  },\n  yAxis: {},\n  series: [{{\n    name: \'销量\',\n    type: \'bar\',\n    data: [5, 20, 36, 10, 10, 20, 5]\n  }}]\n}\n```\n';
    setMarkdownContent(defaultContent);
  }, []);

  // 更新预览内容
  const updatePreview = (content) => {
    const html = renderMarkdown(content);
    setPreviewContent(html);
    setHeadings(generateTOC(content));
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
      };
      reader.readAsText(file);
    }
  };

  // 下载MD文件
  const downloadMDHandler = () => {
    downloadMD(markdownContent);
  };

  // 保存文件
  const saveFileHandler = () => {
    downloadMD(markdownContent, 'document.md');
  };

  // 复制MD内容
  const copyMDHandler = () => {
    copyToClipboard(markdownContent);
  };

  // 清空编辑器
  const clearEditor = () => {
    setMarkdownContent('');
  };

  // 重置编辑器
  const resetEditor = () => {
    const defaultContent = '# Fly Markdown 实时预览器\n\n欢迎使用 Fly Markdown 实时预览器！这是一个功能强大的 Markdown 编辑器，支持实时预览、暗黑模式、代码高亮、数学公式、图表等功能。\n\n## 功能特性\n\n- ✅ 实时预览\n- ✅ 暗黑模式\n- ✅ 代码高亮\n- ✅ 数学公式（KaTeX）\n- ✅ Mermaid 图表\n- ✅ ECharts 图表\n- ✅ 任务列表\n- ✅ 脚注\n- ✅ 表格\n- ✅ 代码块\n\n## 快捷键\n\n- **Ctrl+B**: 加粗\n- **Ctrl+I**: 斜体\n- **Ctrl+K**: 超链接\n- **Ctrl+E**: 行内代码\n\n## 示例\n\n### 代码块\n\n```javascript\nfunction hello() {\n  console.log(\'Hello, world!\');\n}\n```\n\n### 数学公式\n\n行内公式：$E=mc^2$\n\n块级公式：\n\n$$\n\\int_0^1 x^2 dx = \\frac{1}{3}\n$$\n\n### Mermaid 图表\n\n```mermaid\ngraph TD\n  A[开始] --> B[处理]\n  B --> C{条件}\n  C -->|是| D[结果1]\n  C -->|否| E[结果2]\n  D --> F[结束]\n  E --> F\n```\n\n### ECharts 图表\n\n```echarts\n{\n  title: {\n    text: \'示例图表\'\n  },\n  tooltip: {},\n  xAxis: {\n    data: [\'Mon\', \'Tue\', \'Wed\', \'Thu\', \'Fri\', \'Sat\', \'Sun\']\n  },\n  yAxis: {},\n  series: [\n    {\n      name: \'销量\',\n      type: \'bar\',\n      data: [5, 20, 36, 10, 10, 20, 5]\n    }\n  ]\n}\n```\n';
    setMarkdownContent(defaultContent);
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

  return (
    <div className="flex flex-col items-center w-full h-screen">
      {/* 头部 */}
      <Suspense fallback={<Loading />}>
        <Header />

        {/* 主容器 */}
        <div id="app-container" className="flex flex-row gap-3 md:gap-4 w-full max-w-[1600px] flex-1 min-h-[600px] mb-2 px-2 md:px-0 relative h-[calc(100vh-80px)]">
          {/* 左侧文件管理 */}
          <FileSidebar showFileSidebar={showFileSidebar} onToggleFileSidebar={toggleFileSidebar} />

          <div className="core-area flex flex-col flex-1 min-w-0 h-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-300 dark:border-slate-700 overflow-hidden">
            {/* 工具栏 */}
            <Toolbar
              onFileUpload={() => document.getElementById('file-upload').click()}
              onClearEditor={clearEditor}
              onResetEditor={resetEditor}
              onDownloadMD={downloadMDHandler}
              onSaveFile={saveFileHandler}
              onCopyMD={copyMDHandler}
              mode={mode}
              onSetMode={setModeHandler}
              onToggleTOC={toggleTOC}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
              onToggleFullScreen={toggleFullScreen}
            />
            <input type="file" id="file-upload" accept=".md,.txt" className="hidden" onChange={handleFileUpload} />

            {/* 主工作区 */}
            <main id="main-workspace" className={`flex flex-row flex-1 relative bg-white dark:bg-slate-800 items-stretch overflow-hidden w-full h-full ${mode === 'preview' ? 'is-preview-mode' : ''}`}>
              {/* 文档大纲 */}
              <TOC showTOC={showTOC} onToggleTOC={toggleTOC} headings={headings} />

              {/* 编辑器面板 */}
              {mode !== 'preview' && (
                <>
                  <Editor markdownContent={markdownContent} onContentChange={setMarkdownContent} darkMode={darkMode} />
                  <div id="main-resizer" className="hidden md:flex flex-col justify-center items-center w-2 cursor-col-resize bg-gray-50 dark:bg-slate-900 border-x border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors z-20 shrink-0 h-full group">
                    <div className="w-[2px] h-full bg-transparent group-hover:bg-blue-400 transition-colors mx-auto"></div>
                  </div>
                </>
              )}

              {/* 预览面板 */}
              <Preview previewContent={previewContent} />
            </main>
          </div>
        </div>
      </Suspense>
    </div>
  );
}

export default App;
