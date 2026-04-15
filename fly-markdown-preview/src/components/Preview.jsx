import { useEffect, useRef } from 'react';
import { renderMermaid, renderECharts } from '../utils/markdownUtils';

function Preview({ previewContent }) {
  const previewRef = useRef(null);

  // 渲染图表
  useEffect(() => {
    const renderCharts = async () => {
      if (previewRef.current) {
        await renderMermaid(previewRef.current);
        await renderECharts(previewRef.current);
      }
    };

    const timer = setTimeout(() => {
      renderCharts();
    }, 100);

    return () => clearTimeout(timer);
  }, [previewContent]);

  return (
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
  );
}

export default Preview;
