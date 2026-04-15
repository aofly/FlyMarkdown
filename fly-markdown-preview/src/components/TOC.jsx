

function TOC({ showTOC, onToggleTOC, headings }) {
  if (!showTOC) return null;

  return (
    <>
      <aside id="toc-pane" className="flex-col bg-gray-50 dark:bg-slate-900 shrink-0 h-full w-[220px]" style={{ flex: '0 0 220px' }}>
        <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-slate-700 shrink-0 flex justify-between items-center" style={{ height: '44px' }}>
          <span><i className="fa-solid fa-location-crosshairs mr-1"></i> 文档大纲</span>
          <button onClick={onToggleTOC} className="hover:text-red-500 dark:hover:text-red-400 transition" title="隐藏大纲"><i className="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div id="toc-list" className="p-4 flex-1 overflow-y-auto space-y-1.5 text-sm">
          {headings.length > 0 ? (
            headings.map((heading, index) => (
              <a
                key={index}
                href={`#${heading.id}`}
                className={`block py-1.5 px-2 rounded transition-colors hover:bg-gray-200 dark:hover:bg-slate-700 ${'pl-' + (heading.level * 2 - 2)}`}
                style={{ paddingLeft: `${(heading.level - 1) * 16}px` }}
              >
                {heading.text}
              </a>
            ))
          ) : (
            <div className="text-gray-400 dark:text-gray-500 text-sm">无大纲内容</div>
          )}
        </div>
      </aside>
      <div id="toc-resizer" className="hidden md:flex flex-col justify-center items-center w-2 cursor-col-resize bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors z-20 shrink-0 h-full group">
        <div className="w-[2px] h-full bg-transparent group-hover:bg-blue-400 transition-colors mx-auto"></div>
      </div>
    </>
  );
}

export default TOC;
