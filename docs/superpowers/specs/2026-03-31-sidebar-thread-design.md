# Sidebar Thread 组件设计

## 一、概述

Sidebar 是应用左侧的功能导航区域，从上到下分为：

- 功能按钮区（已完成）
- 置顶 Thread 区
- Thread 区（可拖拽树形结构）
- 底部功能区（已完成）

## 二、数据模型

### 基础类型

```typescript
interface Thread {
  id: string
  title: string
  updatedAt: Date
  isPinned: boolean
  folderId: string | null
}

interface Folder {
  id: string
  title: string
  order: number
}
```

### 树节点格式 (flatData for headless-tree)

```typescript
type TreeNode =
  | { type: 'folder'; id: string; name: string; order: number }
  | {
      type: 'thread'
      id: string
      name: string
      folderId: string | null
      updatedAt: Date
      isPinned: boolean
    }
```

## 三、组件结构

```
AppSidebar
├── SidebarHeader (已完成)
├── ScrollArea
│   ├── PinnedSection
│   │   ├── TitleCell (固定置顶标题)
│   │   └── ThreadCell[] (置顶的 thread，无拖拽)
│   └── ThreadSection
│       ├── TitleCell (可切换视图模式)
│       └── FolderView / FlatView (根据 viewMode 切换)
│           ├── FolderView (folder 模式)
│           │   └── FolderCell[] (可拖拽排序)
│           │       └── ThreadCell[] (子线程，不可拖拽)
│           └── FlatView (扁平模式)
│               └── ThreadCell[] (所有 thread 按更新时间排序)
└── SidebarFooter (已完成)
```

## 四、headless-tree 集成

### 4.1 数据扁平化

Folder 和 Thread 分别存储，通过 `folderId` 建立父子关系。使用 `flatData` 格式传入 headless-tree。

### 4.2 拖拽规则

- **可拖拽**：folder 节点
- **不可拖拽**：thread 节点
- **drop indicator**：2px 高度线条，填充色跟随主题
- **拖拽范围**：仅限 folder 之间调整顺序

### 4.3 展开状态持久化

使用 jotai + localStorage 持久化 `openFolders` atom。

## 五、Cell 组件详细设计

### 5.1 ThreadCell

**布局**（从左到右）：

- 图标区（32px）：hover 时显示 PinIcon，非 hover 留空白
- 名称区（flex-1）：thread 名称，text-ellipsis
- 尾部区（96px）：显示上次更新时间，hover 时显示操作按钮

**状态**：

- default：正常显示
- hover：左侧显示置顶图标，右侧显示操作按钮
- active/selected：高亮背景

### 5.2 FolderCell

**布局**（从左到右）：

- 图标区（32px）：展开显示 FolderOpenIcon，折叠显示 FolderCloseIcon；hover 时显示 ExpandIcon/CollapseIcon
- 名称区（flex-1）：folder 名称，text-ellipsis
- 操作区：MoreIcon + AddThreadIcon

**状态**：

- collapsed：显示折叠图标
- expanded：显示展开图标，显示子线程

### 5.3 TitleCell

**布局**（从左到右）：

- 名称区（flex-1）：标题名称，text-ellipsis
- 操作区：SortIcon + AddIcon

### 5.4 Cell（基础样式）

提供所有 Cell 的公共样式：

- 高度：36px
- 圆角：6px
- hover/active 状态样式
- text-ellipsis 样式

## 六、视图模式

### 6.1 Folder 模式（默认）

- 显示 folder 列表
- 每个 folder 可折叠/展开
- folder 可拖拽排序
- folder 内的 thread 按更新时间排序

### 6.2 Flat 模式

- 所有 thread 平铺显示
- 按更新时间排序
- 无 folder 结构

## 七、图标清单

使用 @hugeicons/core-free-icons：

| 用途           | 图标名称              |
| -------------- | --------------------- |
| 置顶           | `PinIcon`             |
| 展开           | `ArrowDown01Icon`     |
| 折叠           | `ArrowRight01Icon`    |
| 文件夹（展开） | `FolderOpenIcon`      |
| 文件夹（折叠） | `FolderCloseIcon`     |
| 排序           | `SortAscending02Icon` |
| 添加           | `Add01Icon`           |
| 更多操作       | `MoreHorizontalIcon`  |
| 新建线程       | `PlusSignIcon`        |

## 八、状态管理

```typescript
// view mode
const [viewMode, setViewModeAtom] = useAtom(viewModeAtom) // 'folder' | 'flat'

// folder 展开状态（持久化）
const [openFolders, setOpenFoldersAtom] = useAtom(openFoldersAtom) // Set<string>

// tree instance
const tree = useTree({ flatData, rootItemEmpty: 'children' })
```

## 九、技术栈

- @headless-tree/core
- @headless-tree/react
- @hugeicons/core-free-icons + @hugeicons/react
- jotai + localStorage (持久化)
