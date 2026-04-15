

function FileSidebar({ showFileSidebar, onToggleFileSidebar }) {
  if (showFileSidebar) {
    return (
      <aside id="file-sidebar" className="w-56 lg:w-64 flex flex-col bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl shadow-xl shrink-0 z-40 relative h-full overflow-hidden transition-all duration-300">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 shrink-0 flex justify-between items-center bg-gray-100 dark:bg-slate-900 h-[55px]">
          <span className="text-base font-bold text-gray-700 dark:text-gray-300"><i className="fa-solid fa-folder-tree text-orange-500 mr-1.5"></i> 资源库</span>
          <div className="flex gap-2">
            <button className="text-gray-500 hover:text-yellow-600 transition" title="根目录新建文件夹"><i className="fa-solid fa-folder-plus text-base"></i></button>
            <button className="text-gray-500 hover:text-green-500 transition" title="根目录新建文件"><i className="fa-solid fa-plus text-base"></i></button>
            <button onClick={onToggleFileSidebar} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition" title="向左隐藏"><i className="fa-solid fa-chevron-left text-base"></i></button>
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
    );
  } else {
    return (
      <aside id="file-sidebar-collapsed" className="w-16 flex flex-col bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl shadow-xl shrink-0 z-40 transition-all duration-300 items-center py-4 h-fit self-start">
        <button onClick={onToggleFileSidebar} className="text-gray-500 hover:text-orange-500 transition mb-4" title="展开资源库"><i className="fa-solid fa-folder-tree text-xl"></i></button>
        <div className="w-10 h-px bg-gray-200 dark:bg-slate-700 mb-4"></div>
        <button className="text-gray-500 hover:text-green-500 transition mb-4" title="新建文件"><i className="fa-solid fa-plus text-xl"></i></button>
        <button className="text-gray-500 hover:text-yellow-600 transition" title="新建文件夹"><i className="fa-solid fa-folder-plus text-xl"></i></button>
      </aside>
    );
  }
}

export default FileSidebar;
