# Panel 系统重构设计

**状态**: 进行中 ( brainstorming )
**创建日期**: 2026-04-08
**最后更新**: 2026-04-08

---

## 背景

ChatPage 需要支持类似 harnss 的侧边栏 panel 系统。用户可以通过快捷键切换侧边栏内容。

## 确认的设计决策

### Panel 类型

| Panel | 类型标识 | 功能 |
|-------|----------|------|
| GitPanel | `git` | 完整 Git 功能（分支切换、暂存、提交、stash、rebase、merge、push/pull） |
| OpenFilesPanel | `openFiles` | 显示 AI session 中访问的文件，点击跳转 Chat |
| ProjectFilesPanel | `projectFiles` | 项目文件浏览器，实时监控 + 搜索 |
| BrowserPanel | `browser` | Browser 窗口管理器（显示窗口列表、新建/关闭操作） |

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `1` | 切换到 GitPanel |
| `2` | 切换到 OpenFilesPanel |
| `3` | 切换到 ProjectFilesPanel |
| `4` | 打开 Browser 窗口管理器 panel |

> 快捷键可自定义，默认如上表。

### 布局结构

- 单一 Panel 模式：同一位置只显示一个 panel
- 可调整大小：保留 resize 功能，panel 宽度可拖拽调整
- 可折叠：panel 可折叠隐藏，但保持状态

**现状**: 现有布局已经具备 A+B+C 能力，不需要大调整。

### Panel Header

- 统一设计语言
- 各 Panel 独立实现
- 共享 PanelHeader、SearchBar 等基础组件

### 虚拟列表

按需使用 `@tanstack/react-virtual`，由各 panel 自行决定。

### OpenFilesPanel 跳转

仅高亮对应 tool call，用户点击时滚动 Chat 视图到该位置。

### 状态持久化

**混合模式**:
- **UI 状态持久化到 localStorage**: panel 宽度、折叠状态、显示偏好
- **Panel 内部业务状态不持久化**: Git 当前分支、Browser URL 等，每次打开从系统/项目获取最新状态
- **会话隔离**: 各 session 独立状态

### Browser 实现方案

采用 **craft-agents-oss 方案**:

| 方面 | 选择 |
|------|------|
| Webview 技术 | `BrowserView` + `WebContentsView` (Electron API) |
| DOM 拾取 | **CDP (Chrome DevTools Protocol)** |
| Toolbar | 独立的 `BrowserWindow` + React App |
| 元素标识 | Accessibility Tree ref (`@e1`, `@e2` 等) |

**参考**: `temp/craft-agents-oss/apps/electron/src/main/browser-pane-manager.ts`

### Browser 窗口管理器 Panel

作为 Browser 独立窗口的"控制面板":

- 显示所有打开的 Browser 窗口列表
- 显示每个窗口的标题/URL
- 支持新建、关闭 Browser 窗口
- 点击可以聚焦/激活对应的 Browser 窗口

### Browser 窗口与 ChatPage 交互

参考 craft-agents-oss 的实现方式。

---

## 待详细设计的 Panel

- [ ] GitPanel 详细设计
- [ ] OpenFilesPanel 详细设计
- [ ] ProjectFilesPanel 详细设计
- [ ] Browser 窗口管理器 Panel 详细设计
- [ ] 共享组件设计 (PanelHeader, SearchBar 等)
- [ ] IPC 接口设计

---

## 参考资料

- harnss 源码: `temp/harnss`
- harnss 文档: `docs/OpenSource03_harnss`
- craft-agents-oss 源码: `temp/craft-agents-oss`
- craft-agents-oss 文档: `docs/lukilabs_craft-agents-oss`
