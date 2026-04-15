

function Toolbar({
  onFileUpload,
  onClearEditor,
  onResetEditor,
  onDownloadMD,
  onCopyMD,
  mode,
  onSetMode,
  onToggleTOC,
  darkMode,
  onToggleDarkMode,
  onToggleFullScreen,
  onSaveFile
}) {
  return (
    <header className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 z-30 flex flex-col md:flex-row md:items-center px-4 py-2.5 shrink-0 w-full">
      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="flex bg-white dark:bg-slate-800 rounded p-1 border border-gray-200 dark:border-slate-700 shrink-0 shadow-sm transition-colors">
          <button onClick={onFileUpload} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="导入内容"><i className="fa-solid fa-file-import text-yellow-600 text-base"></i> <span className="hidden xl:inline font-medium">导入</span></button>
          <button onClick={onSaveFile} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="保存文件"><i className="fa-solid fa-save text-green-600 dark:text-green-400 text-base"></i> <span className="hidden xl:inline font-medium">保存</span></button>
          <button className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="粘贴"><i className="fa-solid fa-paste text-blue-500 text-base"></i> <span className="hidden xl:inline font-medium">粘贴</span></button>
          <button onClick={onClearEditor} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm" title="清空"><i className="fa-solid fa-trash-can text-base"></i> <span className="hidden lg:inline font-medium">清空</span></button>
          <button onClick={onResetEditor} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="重置文档"><i className="fa-solid fa-rotate-right text-green-600 dark:text-green-400 text-base"></i> <span className="hidden lg:inline font-medium">重置</span></button>
          <button className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-purple-600 dark:text-purple-400 border-l border-gray-200 dark:border-slate-600 pl-3 ml-1 text-sm" title="快照时光机"><i className="fa-solid fa-clock-rotate-left text-base"></i> <span className="hidden lg:inline font-medium">时光机</span></button>
        </div>

        <div className="flex bg-white dark:bg-slate-800 rounded p-1 border border-gray-200 dark:border-slate-700 shrink-0 shadow-sm transition-colors">
          <button onClick={onDownloadMD} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="下载 MD"><i className="fa-solid fa-download text-indigo-500 dark:text-indigo-400 text-base"></i> <span className="hidden lg:inline font-medium">下载 MD</span></button>
          <button onClick={onCopyMD} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="复制 MD"><i className="fa-regular fa-copy text-gray-600 dark:text-gray-400 text-base"></i> <span className="hidden lg:inline font-medium">复制 MD</span></button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-white dark:bg-slate-800 rounded p-1 border border-gray-200 dark:border-slate-700 select-none shadow-sm transition-colors">
            <button onClick={() => onSetMode('split')} className={`px-4 py-1.5 rounded ${mode === 'split' ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'} transition-all flex items-center gap-1.5 text-sm font-medium`} title="分屏"><i className="fa-solid fa-table-columns text-base"></i> <span className="hidden md:inline">分屏</span></button>
            <button onClick={() => onSetMode('preview')} className={`px-4 py-1.5 rounded ${mode === 'preview' ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'} transition-all flex items-center gap-1.5 text-sm font-medium`} title="仅预览"><i className="fa-solid fa-desktop text-base"></i> <span className="hidden md:inline">预览</span></button>
          </div>
          <div className="flex bg-white dark:bg-slate-800 rounded p-1 border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
            <button onClick={onToggleTOC} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="开关大纲"><i className="fa-solid fa-list-ul text-teal-600 dark:text-teal-400 text-base"></i> <span className="hidden lg:inline font-medium">大纲</span></button>
            <button onClick={onToggleDarkMode} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="开关夜间模式"><i id="theme-icon" className={`fa-solid ${darkMode ? 'fa-sun text-yellow-400' : 'fa-moon text-indigo-500'} text-base`}></i> <span className="hidden lg:inline font-medium">主题</span></button>
            <button onClick={onToggleFullScreen} className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-all flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm" title="全屏"><i className="fa-solid fa-expand text-gray-700 dark:text-gray-400 text-base"></i> <span className="hidden lg:inline font-medium">全屏</span></button>
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
  );
}

export default Toolbar;
