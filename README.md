# Fly Markdown 实时预览器

一个功能强大、界面美观的 Markdown 实时预览编辑器，支持丰富的 Markdown 语法和多种导出格式。

## 功能特性

### 📝 核心编辑功能
- **实时预览**: 编辑与预览同步显示
- **Markdown 语法高亮**: 支持 GFM 标准语法
- **代码高亮**: 支持 100+ 种编程语言的语法高亮
- **数学公式**: 支持 LaTeX 数学公式渲染
- **Mermaid 图表**: 支持流程图、序列图、甘特图等
- **ECharts 图表**: 支持交互式数据可视化图表
- **快捷键支持**: 常用操作的快捷方式

### 🎨 用户界面
- **深色/浅色主题**: 支持自动切换
- **响应式设计**: 完美适配不同屏幕尺寸
- **分屏预览**: 编辑器与预览并排显示
- **全屏模式**: 专注写作体验
- **文档大纲**: 自动生成目录导航
- **文件管理**: 支持本地文件和浏览器缓存存储

### 📤 导出功能
- **Markdown 下载**: 直接下载 .md 文件
- **HTML 导出**: 导出为独立 HTML 网页
- **PDF 导出**: 高清 PDF 文档生成
- **Word 导出**: Microsoft Word 格式
- **图片导出**: 高清长图导出 (.png)
- **剪贴板操作**: 支持复制为多种格式

### ⏱️ 高级功能
- **版本历史**: 时光机快照功能
- **搜索替换**: 编辑器内搜索和替换
- **本地存储**: 浏览器内持久化存储
- **导入功能**: 支持导入本地 Markdown 文件
- **任务列表**: 交互式待办事项

## 快速开始

### 方式一：直接打开
直接用浏览器打开 `index.html` 文件即可使用。

### 方式二：使用本地服务器
```bash
# 使用 Python 3
python3 -m http.server 3000

# 或者使用 Node.js
npx serve -l 3000
```

然后在浏览器中访问 `http://localhost:3000`

### 方式三：使用 npm 脚本
```bash
npm run dev
```

## 技术栈

- **编辑器**: CodeMirror 6
- **Markdown 渲染**: Marked.js
- **数学公式**: KaTeX
- **代码高亮**: Highlight.js
- **图表**: Mermaid + ECharts
- **UI 框架**: Tailwind CSS
- **图标**: Font Awesome

## 快捷键

| 功能 | 快捷键 |
|------|--------|
| 加粗 | Ctrl+B |
| 斜体 | Ctrl+I |
| 行内代码 | Ctrl+E |
| 链接 | Ctrl+K |
| 搜索 | Ctrl+F |
| 保存 | Ctrl+S |
| 撤销 | Ctrl+Z |
| 重做 | Ctrl+Shift+Z |

## Markdown 语法支持

### 基础语法
- 标题 (H1-H6)
- 粗体、斜体、删除线、高亮
- 有序/无序列表
- 任务列表
- 链接和图片
- 代码块和行内代码
- 表格
- 引用
- 水平分隔线

### 扩展功能
- 数学公式 ($ 行内公式 $, $$ 块级公式 $$)
- Mermaid 图表
- ECharts 数据可视化
- 脚注
- 折叠块 (details/summary)

## 浏览器支持

- Chrome/Edge (推荐)
- Firefox
- Safari
- 任何现代浏览器

## 项目结构

```
fly-markdown-editor/
├── index.html              # 主入口文件
├── package.json            # 项目配置
├── README.md              # 项目文档
├── .gitignore             # Git 忽略文件
├── src/
│   ├── css/
│   │   └── styles.css     # 自定义样式
│   └── js/                # JavaScript 模块
└── index.html.backup      # 备份文件
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 完整的 Markdown 编辑和预览功能
- 多种导出格式支持
- 深色/浅色主题切换
