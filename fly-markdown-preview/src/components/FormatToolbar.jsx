

function FormatToolbar({ onInsertFormat }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-900 px-3 py-1.5 flex flex-wrap gap-2 border-b border-gray-200 dark:border-slate-700 shrink-0 shadow-sm transition-colors z-20 items-center select-none overflow-x-auto">
      {/* 1. 基础文本排版 */}
      <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
        <button onClick={() => onInsertFormat('bold')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700" title="加粗 (Ctrl+B)"><i className="fa-solid fa-bold text-sm"></i></button>
        <button onClick={() => onInsertFormat('italic')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="斜体 (Ctrl+I)"><i className="fa-solid fa-italic text-sm"></i></button>
        <button onClick={() => onInsertFormat('underline')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="下划线"><i className="fa-solid fa-underline text-sm"></i></button>
        <button onClick={() => onInsertFormat('strike')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="删除线"><i className="fa-solid fa-strikethrough text-sm"></i></button>
        <button onClick={() => onInsertFormat('mark')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="高亮标记"><i className="fa-solid fa-highlighter text-sm"></i></button>
        <button onClick={() => onInsertFormat('inline-code')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-r" title="行内代码 (Ctrl+E)"><i className="fa-solid fa-terminal text-sm"></i></button>
      </div>

      {/* 2. 标题层级 */}
      <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm font-bold shrink-0">
        <button onClick={() => onInsertFormat('h1')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700 text-sm" title="一级标题">H1</button>
        <button onClick={() => onInsertFormat('h2')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700 text-sm" title="二级标题">H2</button>
        <button onClick={() => onInsertFormat('h3')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700 text-sm" title="三级标题">H3</button>
        <button onClick={() => onInsertFormat('h4')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-r text-sm" title="四级标题">H4</button>
      </div>

      {/* 3. 列表与引用 */}
      <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
        <button onClick={() => onInsertFormat('ul')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700" title="无序列表"><i className="fa-solid fa-list-ul text-sm"></i></button>
        <button onClick={() => onInsertFormat('ol')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="有序列表"><i className="fa-solid fa-list-ol text-sm"></i></button>
        <button onClick={() => onInsertFormat('task')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="任务列表"><i className="fa-solid fa-list-check text-sm"></i></button>
        <button onClick={() => onInsertFormat('quote')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-r" title="引用段落"><i className="fa-solid fa-quote-left text-sm"></i></button>
      </div>

      {/* 4. 复杂块与折叠 */}
      <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
        <button onClick={() => onInsertFormat('code-block')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700" title="代码段"><i className="fa-solid fa-file-code text-sm"></i></button>
        <button onClick={() => onInsertFormat('table')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="插入表格"><i className="fa-solid fa-table text-sm"></i></button>
        <button onClick={() => onInsertFormat('details')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-r" title="折叠块"><i className="fa-solid fa-layer-group text-sm"></i></button>
      </div>

      {/* 5. 数学公式与图表 */}
      <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
        <button onClick={() => onInsertFormat('math-inline')} className="w-8 h-7 flex items-center justify-center text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700" title="行内公式"><i className="fa-solid fa-subscript text-sm"></i></button>
        <button onClick={() => onInsertFormat('math-block')} className="w-8 h-7 flex items-center justify-center text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="块级公式"><i className="fa-solid fa-square-root-variable text-sm"></i></button>
        <button onClick={() => onInsertFormat('mermaid')} className="w-8 h-7 flex items-center justify-center text-pink-600 dark:text-pink-400 hover:text-pink-700 hover:bg-pink-50 dark:hover:bg-slate-700 transition-colors rounded-r" title="Mermaid 图表模板"><i className="fa-solid fa-project-diagram text-sm"></i></button>
      </div>

      {/* 6. 媒体与链接 */}
      <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
        <button onClick={() => onInsertFormat('link')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-l border-r border-gray-200 dark:border-slate-700" title="超链接 (Ctrl+K)"><i className="fa-solid fa-link text-sm"></i></button>
        <button onClick={() => onInsertFormat('image')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-r border-gray-200 dark:border-slate-700" title="插入图片 (Ctrl+V)"><i className="fa-regular fa-image text-sm"></i></button>
        <button onClick={() => onInsertFormat('hr')} className="w-8 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors rounded-r" title="分割线"><i className="fa-solid fa-minus text-sm"></i></button>
      </div>

      {/* Help Button */}
      <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded shadow-sm shrink-0">
        <button className="w-8 h-7 flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors rounded" title="Markdown 语法与帮助指引"><i className="fa-solid fa-circle-question text-sm"></i></button>
      </div>
    </div>
  );
}

export default FormatToolbar;
