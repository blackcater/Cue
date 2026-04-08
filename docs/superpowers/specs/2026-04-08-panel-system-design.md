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
| OutlinePanel | `outline` | 显示当前对话的大纲（会话结构），点击跳转 Chat 对应位置 |
| ProjectFilesPanel | `projectFiles` | 项目文件浏览器，实时监控 + 搜索 |
| BrowserPanel | `browser` | Browser 窗口管理器（显示窗口列表、新建/关闭操作） |

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `1` | 切换到 GitPanel |
| `2` | 切换到 OutlinePanel |
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

## GitPanel 详细设计

### 状态同步

- **轮询模式**: 每 3 秒轮询刷新
- **Lock-free**: 使用 `--no-optional-locks` 标志避免 git 操作阻塞
- **缓存**: 内存缓存，忽略页面不可见时的轮询

### Git 库

使用 `simple-git` 封装 git 命令。

### 多 Repo 支持

**暂不需要**。单 repo 模式，直接使用项目根目录作为 repo path。

### 组件结构

Tab 切换布局：
- **Changes Tab**: 显示文件变更（Staged / Unstaged）
- **Commits Tab**: 显示最近提交历史

### Commit Message

支持 AI 生成 commit message。

### IPC 接口

使用 `buildCallApi` 模式：

```typescript
// Main: apps/desktop/src/main/handlers/git.ts
export class GitHandler {
  // Status & Info
  status(repoPath: string): Promise<GitStatus>
  branches(repoPath: string): Promise<GitBranch[]>
  currentBranch(repoPath: string): Promise<string>
  log(repoPath: string, count: number): Promise<GitLogEntry[]>
  diffStat(repoPath: string): Promise<{ additions: number; deletions: number }>

  // Staging & Changes
  stage(repoPath: string, files: string[]): Promise<void>
  unstage(repoPath: string, files: string[]): Promise<void>
  stageAll(repoPath: string): Promise<void>
  unstageAll(repoPath: string): Promise<void>
  discard(repoPath: string, files: string[]): Promise<void>

  // Commit
  commit(repoPath: string, message: string): Promise<{ hash: string }>
  generateCommitMessage(repoPath: string): Promise<string>

  // Branch
  checkout(repoPath: string, branch: string): Promise<{ success: boolean }>
  createBranch(repoPath: string, name: string): Promise<void>

  // Remote
  push(repoPath: string): Promise<PushResult>
  pull(repoPath: string): Promise<PullResult>
  fetch(repoPath: string): Promise<void>
}
```

### 文件结构

```
features/chat/components/panel/git/
├── GitPanel.tsx              # 主组件，Tab 布局
├── GitPanelHeader.tsx       # Header（标题 + 刷新按钮）
├── ChangesSection.tsx       # 变更区域（Staged/Unstaged 文件列表）
├── CommitsSection.tsx       # 提交历史区域
├── CommitInput.tsx           # Commit 输入框 + AI 生成按钮
└── index.ts
```

---

## OutlinePanel 详细设计

### 功能

显示当前对话的完整大纲（会话结构）：
- 提取对话中的关键节点（User message, Assistant response, Tool calls 等）
- 按层级展示对话结构
- 点击大纲项滚动到 Chat 中对应的消息位置

### 数据来源

从 session messages 中提取对话结构信息。

### 大纲节点类型

| 类型 | 描述 | 图标 |
|------|------|------|
| UserMessage | 用户发送的消息 | `UserIcon` |
| AssistantMessage | AI 助手回复 | `AssistantIcon` |
| ToolCall | 工具调用（Read/Edit/Write 等） | `ToolIcon` |
| ToolResult | 工具执行结果 | `ResultIcon` |

### 状态管理

内存状态，不持久化。Session 切换时重新计算。

---

## ProjectFilesPanel 详细设计

### 功能

- 递归项目目录视图
- 实时文件监控（fs.watch）
- 实时搜索 + 自动展开匹配目录
- 文件/文件夹创建、重命名、删除
- 在编辑器中打开文件
- 在 Finder/Explorer 中显示

### 数据获取

通过 IPC `files.listAll(cwd)` 获取项目文件列表，使用 `buildFileTree` 构建树形结构。

### 文件监控

- 使用 `files.watch(cwd)` 监听文件变化
- 变化时 150ms debounce 刷新
- 监听 `focus` 和 `visibilitychange` 事件，页面重新可见时刷新

### 搜索

- 200ms debounce 输入
- `filterTree(tree, query)` 过滤目录
- 搜索时自动展开所有匹配目录（`collectDirPaths`）

### 文件操作 IPC

| 操作 | IPC 方法 |
|------|----------|
| 列出文件 | `files.listAll(cwd)` |
| 创建文件 | `files.newFile(fullPath)` |
| 创建文件夹 | `files.newFolder(fullPath)` |
| 重命名 | `files.renameFile(oldPath, newPath)` |
| 删除 | `files.trashItem(fullPath)` |
| 在编辑器打开 | `files.openInEditor(fullPath)` |
| 在 Finder 显示 | `files.showItemInFolder(fullPath)` |
| 监听变化 | `files.watch(cwd)` / `files.unwatch(cwd)` |

### 组件结构

```
features/chat/components/panel/project-files/
├── ProjectFilesPanel.tsx       # 主组件
├── ProjectFilesPanelHeader.tsx # Header（标题 + 刷新按钮）
├── FileTree.tsx               # 文件树组件
├── FileTreeRow.tsx            # 单行文件/目录
├── InlineCreateInput.tsx      # 内联创建输入框
├── SearchBar.tsx              # 搜索栏
└── index.ts
```

### 文件图标

按扩展名着色图标：

| 扩展名 | 颜色 |
|--------|------|
| ts, tsx | 蓝色 |
| js, jsx | 黄色 |
| json | 深黄 |
| css, scss | 紫色/粉色 |
| html | 橙色 |
| md | 灰色 |
| py | 绿色 |
| rs | 橙色 |
| go | 青色 |
| svg | 琥珀色 |
| yaml, yml | 红色 |
| toml | 灰色 |
| sh | 绿色 |

### 右键菜单

- **文件**：`Open in Editor`、`Preview`、`Copy Name`、`Copy Path`、`Copy Absolute Path`、`Rename`、`Move to Trash`
- **目录/文件**：`New File`、`New Folder`、`Copy Name`、`Copy Path`、`Reveal in Finder`、`Rename`、`Move to Trash`

### 状态管理

内存状态，不持久化。展开状态由组件自己管理。

---

## Browser 窗口管理器 Panel 详细设计

### 功能

作为 Browser 独立窗口的"控制面板"：
- 显示所有打开的 Browser 窗口列表
- 显示每个窗口的标题/URL/favicon
- 支持新建、关闭 Browser 窗口
- 点击可以聚焦/激活对应的 Browser 窗口
- 显示加载状态、后退/前进能力

### 技术方案

采用 **craft-agents-oss 方案**：

| 方面 | 选择 |
|------|------|
| Webview 技术 | `BrowserView` + `WebContentsView` (Electron API) |
| DOM 拾取 | **CDP (Chrome DevTools Protocol)** |
| Toolbar | 独立的 `BrowserWindow` + React App |
| 元素标识 | Accessibility Tree ref (`@e1`, `@e2` 等) |

**参考**: `temp/craft-agents-oss/apps/electron/src/main/browser-pane-manager.ts`

### BrowserInstanceInfo

```typescript
interface BrowserInstanceInfo {
  id: string
  url: string
  title: string
  favicon: string | null
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  boundSessionId: string | null
  ownerType: 'session' | 'manual'
  ownerSessionId: string | null
  isVisible: boolean
  agentControlActive: boolean
  themeColor: string | null
}
```

### IPC 接口

使用 `buildCallApi` 模式：

```typescript
// Main: apps/desktop/src/main/handlers/browser.ts
export class BrowserHandler {
  // Instance Management
  create(options?: { id?: string; show?: boolean }): Promise<string>  // returns instanceId
  destroy(id: string): void
  list(): Promise<BrowserInstanceInfo[]>

  // Navigation
  navigate(id: string, url: string): Promise<void>
  goBack(id: string): Promise<void>
  goForward(id: string): Promise<void>
  reload(id: string): void
  stop(id: string): void
  focus(id: string): void

  // DOM Interaction (CDP)
  snapshot(id: string): Promise<AccessibilitySnapshot>
  click(id: string, ref: string): Promise<void>
  fill(id: string, ref: string, value: string): Promise<void>
  select(id: string, ref: string, value: string): Promise<void>
  evaluate(id: string, expression: string): Promise<unknown>
  screenshot(id: string, options?: BrowserScreenshotOptions): Promise<{ base64: string }>
  scroll(id: string, direction: 'up' | 'down' | 'left' | 'right', amount?: number): Promise<void>
}

// Events (Observable)
stateChanged: (info: BrowserInstanceInfo) => void
removed: (id: string) => void
interacted: (id: string) => void
```

### BrowserCDP

使用 `BrowserCDP` 类封装 CDP 操作：
- `getAccessibilitySnapshot()` — 获取页面 accessibility tree
- `clickElement(ref)` — 点击元素（ref 格式 `@e1`, `@e2` 等）
- `fillElement(ref, value)` — 填充表单
- `selectOption(ref, value)` — 选择下拉选项
- `screenshot()` — 页面截图
- `evaluate(expression)` — 执行 JavaScript
- `scroll(direction, amount)` — 滚动页面

### 状态管理

使用 Jotai atoms：
```typescript
browserInstancesMapAtom  // Map<string, BrowserInstanceInfo>
browserInstancesAtom     // BrowserInstanceInfo[]
activeBrowserInstanceIdAtom  // string | null
activeBrowserInstanceAtom    // BrowserInstanceInfo | null
```

状态通过 IPC 事件同步：
- `browserPane.stateChanged` — 实例状态变化
- `browserPane.removed` — 实例被销毁
- `browserPane.interacted` — 实例被交互（聚焦）

### 组件结构

```
features/chat/components/panel/browser/
├── BrowserWindowManagerPanel.tsx  # 主组件
├── BrowserWindowManagerHeader.tsx # Header
├── BrowserWindowList.tsx         # 窗口列表
├── BrowserWindowItem.tsx         # 单个窗口项
├── NewBrowserButton.tsx          # 新建窗口按钮
└── index.ts
```

### 窗口项显示

每个窗口项显示：
- favicon（如果有）
- 标题
- URL（简化显示）
- 加载状态指示器
- 后退/前进状态指示器

---

## 共享组件设计

### PanelHeader

统一的 Panel 头部组件。

**参考**: harnss `PanelHeader.tsx`

```typescript
interface PanelHeaderProps {
  icon?: LucideIcon
  iconNode?: React.ReactNode      // 自定义图标节点，优先级高于 icon
  label: string
  children?: React.ReactNode        // 右侧内容（徽章、计数、按钮）
  separator?: boolean              // 是否显示底部分隔线，默认 true
  className?: string               // 自定义类名
  iconClass?: string               // 图标颜色类
}
```

**布局**: `[icon] [label] [...children (right side)]`

**样式**:
- 图标: `h-3 w-3 shrink-0`
- 标签: `text-[10px] font-semibold tracking-wider uppercase`
- 分隔线: `mx-2` 下的 `h-px bg-foreground/[0.06]`

### SearchBar

统一的搜索栏组件。

**参考**: harnss `ProjectFilesPanel` 内置搜索栏

```typescript
interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number              // 默认 200ms
}
```

**样式**:
- 图标: `Search` from hugeicons
- 输入框: `bg-transparent text-[11px] outline-none`
- 容器: `flex items-center gap-1.5 px-3 py-1`

### TabBar

Tab 切换组件，用于 GitPanel 的 Changes/Commits 切换等。

**参考**: harnss `TabBar` 组件

```typescript
interface Tab {
  id: string
  label: string
  icon?: LucideIcon
}

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onSelectTab: (tabId: string) => void
  headerIcon?: React.ComponentType<{ className?: string }>  // 使用 hugeicons
  headerLabel?: string
  headerActions?: React.ReactNode
  tabMaxWidth?: string
  activeClass?: string
  inactiveClass?: string
  onReorderTabs?: (fromTabId: string, toTabId: string) => void
}
```

### 文件图标

使用 hugeicons，按扩展名着色：

| 扩展名 | 颜色 |
|--------|------|
| ts, tsx | 蓝色 |
| js, jsx | 黄色 |
| json | 深黄 |
| css, scss | 紫色/粉色 |
| html | 橙色 |
| md | 灰色 |
| py | 绿色 |
| rs | 橙色 |
| go | 青色 |
| svg | 琥珀色 |
| yaml, yml | 红色 |
| toml | 灰色 |
| sh | 绿色 |
| 默认 | `text-muted-foreground/70` |

### 下拉菜单

使用 packages/ui 的 DropdownMenu 组件：

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
```

---

## IPC 接口设计

### 整体架构

使用 `buildCallApi` / `buildStreamApi` 模式：

```typescript
// preload/expose.ts
const files = buildCallApi<FilesHandler>('files', ['list', 'search'], rpc)
const git = buildCallApi<GitHandler>('git', [...], rpc)
const browser = buildCallApi<BrowserHandler>('browser', [...], rpc)
```

### 文件操作 IPC

**Main**: `apps/desktop/src/main/handlers/files.ts`

```typescript
export class FilesHandler {
  async list(dirPath: string): Promise<{ files: FileNode[]; error?: string }>
  async search(query: string, rootPath: string): Promise<{ results: SearchResult[]; skippedCount: number }>

  // ProjectFilesPanel 专用（需扩展）
  async listAll(cwd: string): Promise<{ files: string[]; dirs: string[] }>
  async newFile(fullPath: string): Promise<{ ok: boolean }>
  async newFolder(fullPath: string): Promise<{ ok: boolean }>
  async renameFile(oldPath: string, newPath: string): Promise<{ ok: boolean }>
  async trashItem(fullPath: string): Promise<{ ok: boolean }>
  async openInEditor(fullPath: string): Promise<void>
  async showItemInFolder(fullPath: string): Promise<void>
  watch(cwd: string): void
  unwatch(cwd: string): void
  onChanged(callback: (event: { cwd: string }) => void): () => void
}
```

### Git IPC

**Main**: `apps/desktop/src/main/handlers/git.ts`

```typescript
export class GitHandler {
  // Status & Info
  status(repoPath: string): Promise<GitStatus>
  branches(repoPath: string): Promise<GitBranch[]>
  currentBranch(repoPath: string): Promise<string>
  log(repoPath: string, count: number): Promise<GitLogEntry[]>
  diffStat(repoPath: string): Promise<{ additions: number; deletions: number }>

  // Staging & Changes
  stage(repoPath: string, files: string[]): Promise<void>
  unstage(repoPath: string, files: string[]): Promise<void>
  stageAll(repoPath: string): Promise<void>
  unstageAll(repoPath: string): Promise<void>
  discard(repoPath: string, files: string[]): Promise<void>

  // Commit
  commit(repoPath: string, message: string): Promise<{ hash: string }>
  generateCommitMessage(repoPath: string): Promise<string>

  // Branch
  checkout(repoPath: string, branch: string): Promise<{ success: boolean }>
  createBranch(repoPath: string, name: string): Promise<void>

  // Remote
  push(repoPath: string): Promise<PushResult>
  pull(repoPath: string): Promise<PullResult>
  fetch(repoPath: string): Promise<void>
}
```

### Browser IPC

**Main**: `apps/desktop/src/main/handlers/browser.ts`

```typescript
export class BrowserHandler {
  // Instance Management
  create(input?: string | BrowserPaneCreateOptions): Promise<string>  // returns instanceId
  destroy(id: string): void
  list(): Promise<BrowserInstanceInfo[]>

  // Navigation
  navigate(id: string, url: string): Promise<void>
  goBack(id: string): Promise<void>
  goForward(id: string): Promise<void>
  reload(id: string): void
  stop(id: string): void
  focus(id: string): void

  // DOM Interaction (CDP)
  snapshot(id: string): Promise<AccessibilitySnapshot>
  click(id: string, ref: string): Promise<void>
  fill(id: string, ref: string, value: string): Promise<void>
  select(id: string, ref: string, value: string): Promise<void>
  evaluate(id: string, expression: string): Promise<unknown>
  screenshot(id: string, options?: BrowserScreenshotOptions): Promise<{ base64: string; imageFormat: string; metadata: unknown }>
  scroll(id: string, direction: 'up' | 'down' | 'left' | 'right', amount?: number): Promise<void>

  // Events (via observable)
  // stateChanged: (info: BrowserInstanceInfo) => void
  // removed: (id: string) => void
  // interacted: (id: string) => void
}
```

### RPC 类型定义

**Shared**: `apps/desktop/src/shared/rpc/types.ts`

```typescript
// CallMethodNames - 提取返回 T | Promise<T> 的方法
export type CallMethodNames<Handler extends object> = {
  [K in keyof Handler]: Handler[K] extends (...args: any) => infer R
    ? R extends AsyncIterator<unknown, unknown, unknown>
      ? never
      : K
    : never
}[keyof Handler]

// StreamMethodNames - 提取返回 AsyncIterator<T> 的方法
export type StreamMethodNames<Handler extends object> = {
  [K in keyof Handler]: Handler[K] extends (...args: any) => AsyncIterator<unknown, unknown, unknown>
    ? K
    : never
}[keyof Handler]
```

### tRPC Subscriptions 注意

> **Important:** While standard tRPC recommends async generators for subscriptions, `trpc-electron` (used for Electron IPC) **only supports observables**. Use the `observable` pattern:

```typescript
import { observable } from "@trpc/server/observable";

export const createMyRouter = () => {
  return router({
    subscribe: publicProcedure.subscription(() => {
      return observable<MyEvent>((emit) => {
        const handler = (data: MyData) => {
          emit.next({ type: "my-event", data });
        };

        myEmitter.on("my-event", handler);

        return () => {
          myEmitter.off("my-event", handler);
        };
      });
    }),
  });
};
```

---

## 待详细设计的 Panel

- [x] GitPanel 详细设计
- [x] OutlinePanel 详细设计
- [x] ProjectFilesPanel 详细设计
- [x] Browser 窗口管理器 Panel 详细设计
- [x] 共享组件设计 (PanelHeader, SearchBar 等)
- [x] IPC 接口设计

---

## 参考资料

- harnss 源码: `temp/harnss`
- harnss 文档: `docs/OpenSource03_harnss`
- craft-agents-oss 源码: `temp/craft-agents-oss`
- craft-agents-oss 文档: `docs/lukilabs_craft-agents-oss`
