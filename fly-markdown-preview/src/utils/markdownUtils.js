import * as marked from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import * as echarts from 'echarts';
import JSON5 from 'json5';

// 配置marked
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

// 渲染Markdown
export const renderMarkdown = (content) => {
  let html = marked.parse(content);
  html = DOMPurify.sanitize(html);
  return html;
};

// 渲染Mermaid图表
export const renderMermaid = (container) => {
  if (container) {
    mermaid.init({ startOnLoad: false }, container.querySelectorAll('.mermaid'));
  }
};

// 渲染ECharts图表
export const renderECharts = (container) => {
  if (container) {
    const chartElements = container.querySelectorAll('.echarts');
    chartElements.forEach(el => {
      try {
        const config = JSON5.parse(el.textContent);
        const chart = echarts.init(el);
        chart.setOption(config);
        window.addEventListener('resize', () => chart.resize());
      } catch (e) {
        console.error('ECharts config error:', e);
      }
    });
  }
};

// 生成文档大纲
export const generateTOC = (content) => {
  const headings = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      headings.push({
        level,
        text,
        id,
        line: index + 1
      });
    }
  });
  
  return headings;
};

// 插入格式化内容
export const getFormattedText = (format, selectedText = '') => {
  switch (format) {
    case 'bold':
      return `**${selectedText || '加粗文本'}**`;
    case 'italic':
      return `*${selectedText || '斜体文本'}*`;
    case 'underline':
      return `<u>${selectedText || '下划线文本'}</u>`;
    case 'strike':
      return `~~${selectedText || '删除线文本'}~~`;
    case 'mark':
      return `==${selectedText || '高亮文本'}==`;
    case 'inline-code':
      return `\`${selectedText || '代码'}\``;
    case 'h1':
      return `# ${selectedText || '一级标题'}`;
    case 'h2':
      return `## ${selectedText || '二级标题'}`;
    case 'h3':
      return `### ${selectedText || '三级标题'}`;
    case 'h4':
      return `#### ${selectedText || '四级标题'}`;
    case 'ul':
      return `- ${selectedText || '列表项'}`;
    case 'ol':
      return `1. ${selectedText || '列表项'}`;
    case 'task':
      return `- [ ] ${selectedText || '任务项'}`;
    case 'quote':
      return `> ${selectedText || '引用文本'}`;
    case 'code-block':
      return `\`\`\`javascript\n${selectedText || '代码'}\n\`\`\``;
    case 'table':
      return `| 表头1 | 表头2 | 表头3 |\n| --- | --- | --- |\n| 内容1 | 内容2 | 内容3 |`;
    case 'details':
      return `<details>\n<summary>${selectedText || '展开详情'}</summary>\n内容\n</details>`;
    case 'math-inline':
      return `$${selectedText || 'E=mc^2'}$`;
    case 'math-block':
      return `$$\n${selectedText || '\int_0^1 x^2 dx'}\n$$`;
    case 'mermaid':
      return `\`\`\`mermaid\ngraph TD\n  A[开始] --> B[处理]\n  B --> C{条件}\n  C -->|是| D[结果1]\n  C -->|否| E[结果2]\n  D --> F[结束]\n  E --> F\n\`\`\``;
    case 'link':
      return `[${selectedText || '链接文本'}](https://example.com)`;
    case 'image':
      return `![${selectedText || '图片描述'}](https://example.com/image.jpg)`;
    case 'hr':
      return `---`;
    default:
      return selectedText;
  }
};

// 下载MD文件
export const downloadMD = (content, filename = 'document.md') => {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// 复制到剪贴板
export const copyToClipboard = (content) => {
  return navigator.clipboard.writeText(content);
};
