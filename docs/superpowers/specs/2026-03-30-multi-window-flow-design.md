# 多窗口流程测试设计

## 概述

实现桌面应用多窗口流程测试：应用启动 → welcome 窗口 → vault 窗口 → popup 窗口。

## 窗口流程

```
应用启动
    ↓
launch() → WindowManager.createWindow() → createWelcomeWindow()
    ↓
welcome 窗口显示 (#/welcome)
    ↓ [点击"开始"]
rpc.call('system:window:create-vault', 'vault-1')
    ↓
主进程: createVaultWindow('vault-1') + closeWindow('welcome')
    ↓
vault 窗口显示 (#/vault/vault-1)
    ↓ [点击"打开 Chat"]
rpc.call('system:window:create-popup', 'thread-1')
    ↓
主进程: createChatPopupWindow('thread-1')
    ↓
popup 窗口显示 (#/chat-popup/thread-1)
```

## 固定值

| 窗口 | 参数 | 值 |
|------|------|-----|
| vault | vaultId | `vault-1` |
| popup | threadId | `thread-1` |

## 改动文件

### 1. WindowManager.ts

扩展功能：

- 添加 `windows: Map<string, BrowserWindow>` 追踪窗口
- 修改 `createWelcomeWindow()` — 创建后存入 Map
- 修改 `createVaultWindow()` — 创建后存入 Map (`vault:${vaultId}`)
- 修改 `createChatPopupWindow()` — 创建后存入 Map (`popup:${threadId}`)
- 添加 `getWindow(type: string): BrowserWindow | undefined`
- 添加 `closeWindow(type: string): void`
- 添加 `createWindow(): BrowserWindow` — 供 launch.ts 调用，创建 welcome 窗口

### 2. handlers/system.ts

新增 handlers：

```typescript
// window:create-vault - 创建 vault 窗口并关闭 welcome
router.handle('window:create-vault', (_, vaultId: string) => {
  windowManager.createVaultWindow(vaultId)
  windowManager.closeWindow('welcome')
  return { ok: true }
})

// window:create-popup - 创建 popup 窗口
router.handle('window:create-popup', (_, threadId: string) => {
  windowManager.createChatPopupWindow(threadId)
  return { ok: true }
})
```

### 3. welcome 页面

位置：`apps/desktop/src/renderer/src/routes/welcome.tsx`

添加按钮，点击调用 `rpc.call('system:window:create-vault', 'vault-1')`

### 4. vault 页面

位置：`apps/desktop/src/renderer/src/routes/vault/$vaultId.tsx`

添加按钮，点击调用 `rpc.call('system:window:create-popup', 'thread-1')`

### 5. popup 页面

位置：`apps/desktop/src/renderer/src/routes/chat-popup/$threadId.tsx`

简单文本显示，无需交互。

## UI 设计

| 页面 | 内容 |
|------|------|
| welcome | 居中按钮，文案"开始" |
| vault | 居中按钮，文案"打开 Chat" |
| popup | 居中文本"Popup Window" |

## 架构

```
渲染进程 (React)
    ↓ rpc.call
preload (已暴露 rpc)
    ↓
主进程 RPC handlers (handlers/system.ts)
    ↓
WindowManager
    ↓
BrowserWindow 创建/关闭
```

## 依赖

- 现有 `WindowManager` 窗口创建逻辑
- 现有 `rpc` 暴露 (preload)
- 现有 `WindowRegistry` 注册
