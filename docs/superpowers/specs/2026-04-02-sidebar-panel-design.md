# 侧边栏与 Panel 可折叠/调整大小设计

## 1. 概述

实现侧边栏和 Thread 页面 Panel 的可折叠和可调整大小功能。用户可通过顶栏按钮折叠/展开，通过拖拽分隔线调整宽度。

## 2. 布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│  顶栏 (动态)                                                      │
│  [☰][←][→]  [页面标题]                           [操作按钮... Panel📋] │
├──────────┬─────────────────────────────────┬────────────────────┤
│          │                                 │                    │
│ 侧边栏    │         主内容区                 │      Panel        │
│ (可折叠)  │    (聊天区 / NewThread 等)       │    (可折叠)        │
│          │                                 │                    │
└──────────┴─────────────────────────────────┴────────────────────┘
```

- **侧边栏**：固定在左侧，包含导航、线程列表等
- **主内容区**：路由 Outlet，显示页面内容
- **Panel**：Thread 页面右侧辅助面板，显示 Git 提交、文件结构、大纲等内容

## 3. 技术选型

| 技术 | 用途 |
|------|------|
| `react-resizable-panels` | 实现可拖拽调整大小的面板 |
| `atomWithStorage` (Jotai) | 持久化侧边栏和 Panel 状态到 localStorage |
| React Context | 动态顶栏内容分发 |

## 4. 宽度范围

| 区域 | 最小宽度 | 最大宽度 | 默认宽度 |
|------|----------|----------|----------|
| 侧边栏 | 200px | 500px | 256px |
| Panel | 250px | 450px | 320px |

## 5. 状态管理

### sidebarAtom
```typescript
interface SidebarState {
  collapsed: boolean
  width: number
}

export const sidebarAtom = atomWithStorage<SidebarState>('sidebar-state', {
  collapsed: false,
  width: 256,
})
```

### panelAtom
```typescript
interface PanelState {
  collapsed: boolean
  width: number
  type: 'git' | 'files' | 'outline' | null
}

export const panelAtom = atomWithStorage<PanelState>('panel-state', {
  collapsed: false,
  width: 320,
  type: null,
})
```

## 6. 组件结构

### VaultLayout ($vaultId.tsx)
```tsx
function VaultLayout() {
  const sidebar = useAtomValue(sidebarAtom)
  const [panel, setPanel] = useAtom(panelAtom)

  return (
    <ResizablePanelGroup direction="horizontal">
      {/* 侧边栏 */}
      <ResizablePanel
        id="sidebar"
        order={1}
        collapsed={sidebar.collapsed}
        minSize={200}
        maxSize={500}
        defaultSize={256}
      >
        <AppSidebar />
      </ResizablePanel>

      {/* 主内容区 */}
      <ResizablePanel id="main" order={2}>
        <div className="flex h-full flex-col">
          <HeaderArea />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </ResizablePanel>

      {/* Panel - 根据类型渲染 */}
      {!panel.collapsed && panel.type && (
        <ResizablePanel
          id="panel"
          order={3}
          minSize={250}
          maxSize={450}
          defaultSize={320}
        >
          <PanelRouter type={panel.type} />
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  )
}
```

### PanelRouter
```tsx
function PanelRouter({ type }) {
  switch (type) {
    case 'git': return <GitPanel />
    case 'files': return <FilesPanel />
    case 'outline': return <OutlinePanel />
    default: return null
  }
}
```

### 动态顶栏实现
- 使用 React Context (`HeaderContext`) 分发顶栏内容
- `VaultLayout` 提供 Context，包裹 `<Outlet />`
- 子页面通过 `useHeader()` 注册自己的顶栏内容

```tsx
// HeaderContext
const HeaderContext = createContext<{
  content: React.ReactNode
  setContent: (content: React.ReactNode) => void
}>({ content: null, setContent: () => {} })

// VaultLayout 中
<div className="flex h-full flex-col">
  <HeaderContext.Provider value={{ content: headerContent, setContent: setHeaderContent }}>
    <AppHeader>{headerContent}</AppHeader>
    <main>...</main>
  </HeaderContext.Provider>
</div>

// ThreadPage 中
function ThreadPage() {
  const { setContent } = useHeader()
  useEffect(() => {
    setContent({
      title: thread.title,
      actions: [<PanelToggleButton key="panel" />]
    })
  }, [thread.title])
  return <Chat threadId={threadId} />
}
```

## 7. 交互方式

### 折叠/展开
- 通过顶栏按钮触发
- 侧边栏：点击侧边栏折叠按钮
- Panel：点击 Panel 切换按钮（不同页面显示不同的 Panel 选项）

### 调整宽度
- 拖拽 `ResizablePanel` 边缘的分隔线
- 拖拽到最小宽度阈值时自动折叠（可选）

## 8. 快捷键绑定

Panel 类型与快捷键绑定，由用户自定义或系统预设：

| 快捷键 | Panel 类型 | 说明 |
|--------|------------|------|
| `Cmd+\` | - | 切换 Panel 显示/隐藏 |
| `Cmd+g` | git | 显示 Git 提交信息 |
| `Cmd+p` | files | 显示项目文件结构 |
| `Cmd+o` | outline | 显示大纲 |

## 9. 文件变更

### 新增文件
- `apps/desktop/src/renderer/src/components/app-shell/panel/PanelRouter.tsx` - Panel 路由
- `apps/desktop/src/renderer/src/components/app-shell/panel/GitPanel.tsx` - Git Panel
- `apps/desktop/src/renderer/src/components/app-shell/panel/FilesPanel.tsx` - 文件 Panel
- `apps/desktop/src/renderer/src/components/app-shell/panel/OutlinePanel.tsx` - 大纲 Panel
- `apps/desktop/src/renderer/src/contexts/HeaderContext.tsx` - 顶栏 Context

### 修改文件
- `apps/desktop/src/renderer/src/routes/vault/$vaultId.tsx` - 使用 ResizablePanelGroup
- `apps/desktop/src/renderer/src/routes/vault/$vaultId/thread/$threadId.tsx` - 注册 Panel 按钮
- `apps/desktop/src/renderer/src/atoms/sidebar.ts` - 扩展 sidebarAtom
- `apps/desktop/src/renderer/src/atoms/panel.ts` - 新增 panelAtom
- `apps/desktop/src/renderer/src/components/app-shell/AppHeader.tsx` - 支持动态内容
- `apps/desktop/src/renderer/src/components/app-shell/AppSidebar.tsx` - 响应 collapsed 状态
- `apps/desktop/src/renderer/src/types/sidebar.ts` - 扩展 SidebarState 类型
- `apps/desktop/src/renderer/src/types/panel.ts` - 新增 PanelState 类型

## 10. 安装依赖

```bash
bun add react-resizable-panels
```
