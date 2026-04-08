# Panel 系统重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 ChatPage 侧边栏重构为支持 GitPanel、OutlinePanel、ProjectFilesPanel、BrowserWindowManagerPanel 的 panel 系统

**Architecture:** 采用单一 Panel 模式，通过快捷键切换不同 Panel 类型。各 Panel 共享 PanelHeader、SearchBar、TabBar 等基础组件，使用 `buildCallApi` 模式调用 IPC。

**Tech Stack:** React 19, TailwindCSS, hugeicons, @tanstack/react-virtual, Jotai, simple-git (Git), Electron BrowserView/CDP (Browser)

---

## 概述

本计划分为 5 个子计划：

| 子计划 | 文件 | 描述 |
|--------|------|------|
| 1. 共享组件 + 基础设施 | `2026-04-08-panel-infrastructure.md` | PanelHeader、SearchBar、TabBar、PanelType 扩展 |
| 2. GitPanel | `2026-04-08-gitpanel.md` | Git 功能面板（Changes/Commits Tab） |
| 3. OutlinePanel | `2026-04-08-outlinepanel.md` | 对话大纲面板 |
| 4. ProjectFilesPanel | `2026-04-08-project-files-panel.md` | 项目文件浏览器 |
| 5. Browser 窗口管理器 | `2026-04-08-browser-window-manager.md` | Browser 窗口控制面板 |

**执行顺序:** 1 → 2 → 3 → 4 → 5

---

## 文件结构变更概览

### 新建目录

```
apps/desktop/src/renderer/src/features/chat/components/panel/
├── git/                    # GitPanel 组件
│   ├── GitPanel.tsx
│   ├── GitPanelHeader.tsx
│   ├── ChangesSection.tsx
│   ├── CommitsSection.tsx
│   ├── CommitInput.tsx
│   └── index.ts
├── outline/               # OutlinePanel 组件
│   ├── OutlinePanel.tsx
│   ├── OutlinePanelHeader.tsx
│   ├── OutlineTree.tsx
│   ├── OutlineNode.tsx
│   └── index.ts
├── project-files/        # ProjectFilesPanel 组件
│   ├── ProjectFilesPanel.tsx
│   ├── ProjectFilesPanelHeader.tsx
│   ├── FileTree.tsx
│   ├── FileTreeRow.tsx
│   ├── InlineCreateInput.tsx
│   ├── SearchBar.tsx
│   └── index.ts
├── browser/              # BrowserWindowManagerPanel 组件
│   ├── BrowserWindowManagerPanel.tsx
│   ├── BrowserWindowManagerHeader.tsx
│   ├── BrowserWindowList.tsx
│   ├── BrowserWindowItem.tsx
│   ├── NewBrowserButton.tsx
│   └── index.ts
└── shared/               # 共享组件
    ├── PanelHeader.tsx
    ├── SearchBar.tsx
    ├── TabBar.tsx
    └── index.ts
```

### 修改文件

- `apps/desktop/src/renderer/src/types/panel.ts` — 扩展 PanelType
- `apps/desktop/src/renderer/src/features/chat/components/panel/PanelRouter.tsx` — 更新路由
- `apps/desktop/src/renderer/src/features/chat/components/panel/index.ts` — 更新导出
- `apps/desktop/src/main/handlers/git.ts` — 新建 GitHandler
- `apps/desktop/src/main/handlers/browser.ts` — 新建 BrowserHandler
- `apps/desktop/src/main/handlers/files.ts` — 扩展 FilesHandler
- `apps/desktop/src/preload/expose.ts` — 扩展 API

---

## 待办事项

- [ ] `docs/superpowers/plans/2026-04-08-panel-infrastructure.md` — 共享组件 + 基础设施
- [ ] `docs/superpowers/plans/2026-04-08-gitpanel.md` — GitPanel 重构
- [ ] `docs/superpowers/plans/2026-04-08-outlinepanel.md` — OutlinePanel 实现
- [ ] `docs/superpowers/plans/2026-04-08-project-files-panel.md` — ProjectFilesPanel 重构
- [ ] `docs/superpowers/plans/2026-04-08-browser-window-manager.md` — Browser 窗口管理器

---

## 参考资料

- 设计文档: `docs/superpowers/specs/2026-04-08-panel-system-design.md`
- harnss 源码: `temp/harnss`
- craft-agents-oss 源码: `temp/craft-agents-oss`
