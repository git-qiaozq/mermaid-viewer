# Mermaid Viewer 使用指南

> 本文档介绍如何使用 Mermaid Viewer 本地工具来展示 Mermaid 图表和 Markdown 文档。

## 目录

1. [简介](#简介)
2. [功能特性](#功能特性)
3. [快速开始](#快速开始)
4. [使用示例](#使用示例)
5. [快捷键](#快捷键)

---

## 简介

**Mermaid Viewer** 是一个完全本地化的图表展示工具，支持：

- 🎨 **Mermaid 图表渲染** - 流程图、时序图、类图等
- 📝 **Markdown 文档展示** - 完整支持 GFM 语法
- 🌙 **暗黑主题** - 精美的暗色界面设计
- 💾 **历史记录** - 自动保存最近的编辑内容
- 📤 **导出功能** - 支持 SVG 和 PNG 格式导出

## 功能特性

### 支持的图表类型

| 图表类型 | 关键字 | 说明 |
|---------|--------|------|
| 流程图 | `graph` / `flowchart` | 展示流程和决策 |
| 时序图 | `sequenceDiagram` | 展示对象间交互 |
| 类图 | `classDiagram` | 展示类结构关系 |
| 状态图 | `stateDiagram` | 展示状态转换 |
| ER图 | `erDiagram` | 展示实体关系 |
| 甘特图 | `gantt` | 展示项目进度 |
| 饼图 | `pie` | 展示数据占比 |

### 智能识别

工具会**自动识别**输入内容的类型：

- 如果内容以 Mermaid 关键字开头，自动按图表渲染
- 如果内容包含 Markdown 语法特征，自动按文档渲染
- 也可以手动切换模式

## 快速开始

### 1. 启动服务

```bash
cd mermaid-viewer
python server.py
```

### 2. 访问应用

打开浏览器，访问：

```
http://localhost:8080
```

### 3. 开始使用

- **直接输入**：在左侧编辑区输入内容
- **上传文件**：点击"上传文件"按钮选择文件
- **拖拽上传**：将文件拖拽到编辑区

## 使用示例

### 简单流程图

```mermaid
graph LR
    A[开始] --> B[处理]
    B --> C[结束]
```

### 代码示例

下面是一段 JavaScript 代码：

```javascript
// 初始化 Mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'dark'
});

// 渲染图表
async function renderDiagram(code) {
    const { svg } = await mermaid.render('diagram', code);
    document.getElementById('output').innerHTML = svg;
}
```

### 列表示例

**无序列表：**

- 功能一：实时预览
- 功能二：智能识别
- 功能三：历史记录
  - 自动保存
  - 最多保存 20 条

**有序列表：**

1. 打开应用
2. 输入内容
3. 查看预览
4. 导出图片

### 引用

> "简单是终极的复杂。"
> 
> — 列奥纳多·达·芬奇

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + S` | 保存到历史记录 |
| `Ctrl + E` | 导出 SVG |
| `Ctrl + Shift + E` | 导出 PNG |
| `Ctrl + H` | 切换历史面板 |
| `Escape` | 关闭历史面板 |

---

## 结语

希望这个工具能帮助你更好地展示和分享你的图表与文档！

如有问题或建议，欢迎反馈。

**祝使用愉快！** ✨

