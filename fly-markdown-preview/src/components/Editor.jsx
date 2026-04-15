import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import FormatToolbar from './FormatToolbar';

function Editor({ markdownContent, onContentChange, darkMode }) {
  const editorContainerRef = useRef(null);
  const editorViewRef = useRef(null);
  const [charCount, setCharCount] = useState({ lines: 0, chars: 0 });

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
              onContentChange(newContent);
              updateCharCount(newContent);
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

  // 更新字符计数
  const updateCharCount = (content) => {
    const lines = content.split('\n').length;
    const chars = content.length;
    setCharCount({ lines, chars });
  };

  // 插入格式化内容
  const insertFormat = (format) => {
    if (!editorViewRef.current) return;

    const view = editorViewRef.current;
    const selection = view.state.selection;
    const selectedText = view.state.doc.sliceString(selection.from, selection.to);

    // 这里可以调用工具函数获取格式化文本
    // 暂时使用简单实现
    let insertText = '';
    switch (format) {
      case 'bold':
        insertText = `**${selectedText || '加粗文本'}**`;
        break;
      case 'italic':
        insertText = `*${selectedText || '斜体文本'}*`;
        break;
      case 'h1':
        insertText = `# ${selectedText || '一级标题'}`;
        break;
      default:
        insertText = selectedText;
    }

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
    <div id="editor-pane" className="flex flex-col bg-white dark:bg-slate-800 z-10 shrink-0 min-w-0 relative h-full flex-1" style={{ width: '50%', flex: '0 0 50%' }}>
      <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-gray-200 dark:border-slate-700 shrink-0 z-20" style={{ height: '44px' }}>
        <span id="current-filename-display" className="truncate max-w-[250px] text-sm font-bold text-gray-700 dark:text-gray-200"><i className="fa-solid fa-code text-blue-500 mr-1.5"></i>编辑器</span>
        <div className="flex items-center gap-3 shrink-0">
          <span id="save-status" className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium transition-colors"><i className="fa-solid fa-check mr-1.5"></i>已保存</span>
          <span id="char-count" className="hidden md:flex items-center text-xs text-gray-500 dark:text-gray-400">{charCount.lines} 行 | {charCount.chars} 字符</span>
          <button className="text-gray-400 hover:text-blue-500 transition ml-2 text-base" title="搜索与替换 (Ctrl+F)"><i className="fa-solid fa-magnifying-glass"></i></button>
        </div>
      </div>
      
      {/* 格式化工具栏 */}
      <FormatToolbar onInsertFormat={insertFormat} />

      {/* 编辑器容器 */}
      <div id="editor-container" ref={editorContainerRef} className="flex-1 w-full overflow-hidden relative h-full text-left"></div>
    </div>
  );
}

export default Editor;
