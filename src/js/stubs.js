const flyUIStubs = [
    'reqConfirm', 'reqPrompt', 'setStorageMode', 'reqCreateNewFile', 'reqCreateNewFolder', 
    'collapseFileSidebar', 'expandFileSidebar', 'renderFileList', 'switchFile', 
    'toggleDirectoryExpand', 'showContextMenu', 'handleFileUpload', 'pasteContent', 
    'reqClearEditor', 'reqResetEditor', 'openHistoryModal', 'closeHistoryModal', 
    'manualSnapshot', 'renderHistoryListModal', 'downloadMD', 'copyMD', 'setMode', 
    'toggleTOC', 'toggleDarkMode', 'toggleFullScreen', 'openConverterModal', 
    'closeConverterModal', 'switchTab', 'updateModalOutputs', 'exportPDF', 
    'exportWord', 'exportImage', 'exportHTML', 'insertFormat', 'openSearchPanel', 'openHelpModal', 'closeHelpModal',
    'copyCurrentTabContent', 'toggleCustomSearch', 'closeCustomSearch', 'toggleReplaceRow', 'updateSearchQuery', 'execSearch', 'execReplace', 'updateSearchMatchCount'
];
flyUIStubs.forEach(fn => {
    if (!window[fn]) {
        window[fn] = function() {
            const container = document.getElementById('toast-container');
            if (container) {
                const toast = document.createElement('div');
                toast.className = "bg-blue-500 text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 min-w-[250px] toast-enter-active";
                toast.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-lg"></i><span class="text-sm font-medium">核心组件正在加载中，请稍候...</span>';
                container.appendChild(toast);
                setTimeout(() => { 
                    toast.classList.remove('toast-enter-active'); 
                    toast.classList.add('toast-leave-active'); 
                    setTimeout(() => toast.remove(), 300); 
                }, 2000);
            }
        };
    }
});
