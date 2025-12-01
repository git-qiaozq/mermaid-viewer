# Mermaid Viewer

本地化的 Mermaid 图表和 Markdown 文档展示工具，支持离线使用。

## 功能特性

- **Mermaid 图表渲染**：支持流程图、时序图、类图、状态图、ER图、甘特图、饼图等
- **Markdown 文档渲染**：完整支持 GFM (GitHub Flavored Markdown)
- **智能识别**：自动检测输入内容类型（Mermaid/Markdown）
- **文件上传**：支持 `.md`、`.mmd`、`.txt`、`.markdown` 文件
- **历史记录**：自动保存最近 20 条记录到浏览器本地存储
- **导出功能**：支持导出为 SVG 和 PNG 格式
- **暗黑主题**：精美的暗黑风格界面设计
- **完全离线**：所有依赖库已内置，无需网络连接

## 系统要求

- Python 3.x（仅使用标准库，无需安装额外依赖）
- 现代浏览器（Chrome、Firefox、Edge、Safari）

## 快速开始

### 1. 启动服务器

**方式一：命令行启动（显示控制台）**

```bash
cd mermaid-viewer
python server.py
```

**方式二：无窗口启动（Windows 推荐）**

双击 `start.pyw` 文件，服务器将在后台运行，不显示控制台窗口。

服务器默认运行在 `http://localhost:8080`

> 注：如果你的环境是 `python3`，请使用 `python3 server.py`

### 2. 访问应用

打开浏览器，访问 `http://localhost:8080`

### 3. 关闭服务器

两种方式：
- **方式一**：点击界面右上角的「退出」按钮（推荐）
- **方式二**：在终端按 `Ctrl+C`

## 使用说明

### 输入方式

1. **直接输入**：在左侧编辑区直接输入 Mermaid 代码或 Markdown 内容
2. **文件上传**：点击"上传文件"按钮选择文件
3. **拖拽上传**：将文件直接拖拽到编辑区

### 模式切换

- **自动**：自动检测输入内容类型
- **Mermaid**：强制按 Mermaid 格式渲染
- **Markdown**：强制按 Markdown 格式渲染

### 导出图表

- **导出 SVG**：矢量格式，适合编辑和缩放
- **导出 PNG**：位图格式，适合分享和嵌入

### 快捷键

| 快捷键                 | 功能           |
| ---------------------- | -------------- |
| `Ctrl/Cmd + S`         | 保存到历史记录 |
| `Ctrl/Cmd + E`         | 导出 SVG       |
| `Ctrl/Cmd + Shift + E` | 导出 PNG       |
| `Ctrl/Cmd + H`         | 切换历史面板   |
| `Escape`               | 关闭历史面板   |

## Mermaid 示例

### 流程图

```
graph TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[结束]
    D --> E
```

### 时序图

```
sequenceDiagram
    participant A as 用户
    participant B as 系统
    participant C as 数据库
    A->>B: 发送请求
    B->>C: 查询数据
    C-->>B: 返回结果
    B-->>A: 响应数据
```

### 类图

```
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
```

### 饼图

```
pie title 项目时间分配
    "开发" : 45
    "测试" : 25
    "文档" : 15
    "会议" : 15
```

## 项目结构

```
mermaid-viewer/
├── server.py              # Python HTTP 服务器（命令行启动）
├── start.pyw              # 无窗口启动脚本（Windows 双击启动）
├── README.md              # 使用说明
├── examples/              # 示例文件
│   ├── flowchart.mmd      # 流程图示例
│   ├── sequence.mmd       # 时序图示例
│   ├── class-diagram.mmd  # 类图示例
│   ├── state-diagram.mmd  # 状态图示例
│   ├── er-diagram.mmd     # ER图示例
│   ├── gantt.mmd          # 甘特图示例
│   ├── pie-chart.mmd      # 饼图示例
│   └── sample-document.md # Markdown文档示例
└── static/
    ├── index.html         # 主页面
    ├── css/
    │   ├── style.css      # 应用样式
    │   └── highlight-dark.min.css  # 代码高亮主题
    └── js/
        ├── app.js         # 应用逻辑
        ├── mermaid.min.js # Mermaid 图表库
        ├── marked.min.js  # Markdown 解析库
        └── highlight.min.js # 代码高亮库
```

## 示例文件

项目包含多个示例文件，可以直接上传到工具中查看：

| 文件名               | 类型     | 说明               |
| -------------------- | -------- | ------------------ |
| `flowchart.mmd`      | Mermaid  | 用户请求处理流程图 |
| `sequence.mmd`       | Mermaid  | 用户登录时序图     |
| `class-diagram.mmd`  | Mermaid  | 动物类继承关系图   |
| `state-diagram.mmd`  | Mermaid  | 审批状态转换图     |
| `er-diagram.mmd`     | Mermaid  | 电商系统ER图       |
| `gantt.mmd`          | Mermaid  | 项目开发甘特图     |
| `pie-chart.mmd`      | Mermaid  | 开发时间分配饼图   |
| `sample-document.md` | Markdown | 使用指南文档       |

## 离线部署

本工具已包含所有必要的依赖库，可直接复制整个文件夹到任何支持 Python 的环境中运行。

### 内置依赖

- **mermaid.min.js** (v10.x) - Mermaid 图表渲染引擎
- **marked.min.js** - Markdown 解析器
- **highlight.min.js** (v11.9.0) - 代码语法高亮

## 自定义配置

### 修改端口

编辑 `server.py` 文件，修改 `PORT` 变量：

```python
PORT = 8080  # 修改为你需要的端口
```

### 修改主题颜色

编辑 `static/css/style.css` 文件，修改 CSS 变量：

```css
:root {
    --bg-primary: #0d1117;      /* 主背景色 */
    --accent-cyan: #39d4ff;     /* 强调色 */
    --accent-purple: #a371f7;   /* 紫色强调 */
    /* ... */
}
```

## 许可证

MIT License

## 更新日志

### v1.0.0

- 初始版本发布
- 支持 Mermaid 图表渲染
- 支持 Markdown 文档渲染
- 支持历史记录功能
- 支持 SVG/PNG 导出

