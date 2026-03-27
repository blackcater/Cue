# 桌面应用主页页面设计

## 概述

设计桌面应用的主页页面，采用左右分栏布局，聚焦核心交互，便于后续扩展。参考 Cursor AI 代码编辑器的布局风格。

## 结构设计

### 整体布局

```
┌─────────────────────────────────────────────────────────────┐
│                    主应用容器 (100vh)                        │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   侧边栏      │              主内容区                        │
│  (可折叠)     │                                              │
│   200px      │           flex-1                             │
│              │                                              │
│              ├──────────────────────────────────────────────┤
│              │  顶部状态栏 (48px)                            │
│              ├──────────────────────────────────────────────┤
│              │                                              │
│              │           中心引导区                          │
│              │        (flex-1, 居中)                        │
│              │                                              │
│              ├──────────────────────────────────────────────┤
│              │  底部输入区 (输入框 + 发送按钮)                │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### 侧边栏 (LeftSidebar)

**功能：**
- 可折叠/展开，通过点击切换按钮控制
- 折叠时仅显示图标，展开时显示图标+文字
- 宽度：展开 200px，折叠 48px

**导航项：**
1. 新线程 (Plus icon)
2. 技能和应用 (Sparkles icon)
3. 设置 (Settings icon)

**技术实现：**
- 使用 packages/ui 的基础组件
- 折叠状态通过 React state 管理
- 过渡动画使用 CSS transition

### 主内容区 (MainContent)

#### 顶部状态栏 (TopBar)

- 左侧：显示当前状态文字 "新线程"
- 右侧：获取 Plus 徽章（Badge 组件，variant: default）

#### 中心引导区 (Hero)

- 垂直水平居中
- 云形/大脑图标（Brain icon）
- 大标题 "开始构建"（text-3xl font-bold）
- 副标题 "typed" + 下拉箭头图标，表示当前项目上下文

#### 底部输入区 (InputArea)

- 圆角胶囊形输入框
- 半透明深色背景
- 右侧发送按钮（ArrowUp icon）
- placeholder 提示文字

## 组件清单

| 组件 | 来源 | 用途 |
|------|------|------|
| Button | packages/ui | 侧边栏导航项、发送按钮 |
| Badge | packages/ui | Plus 徽章 |
| Input | packages/ui | 文本输入框 |
| ScrollArea | packages/ui | 侧边栏内容区域（如果历史记录较长） |
| Separator | packages/ui | 可选的分隔线 |

## 样式规范

### 颜色（跟随系统主题）

使用 shadcn CSS 变量系统，自动适配深色/浅色模式：

**浅色模式 (`:root`)：**
- 背景：`bg-background` (oklch(1 0 0))
- 侧边栏：`bg-sidebar` (oklch(0.985 0 0))
- 文字：`text-foreground` (oklch(0.145 0 0))
- 边框：`border-border` (oklch(0.922 0 0))

**深色模式 (`.dark`)：**
- 背景：`bg-background` (oklch(0.145 0 0))
- 侧边栏：`bg-sidebar` (oklch(0.205 0 0))
- 文字：`text-foreground` (oklch(0.985 0 0))
- 边框：`border-sidebar-border` (oklch(1 0 0 / 10%))

**语义颜色：**
- Primary：`bg-primary`, `text-primary-foreground`
- Secondary：`bg-secondary`, `text-secondary-foreground`
- Muted：`bg-muted`, `text-muted-foreground`
- Accent：`bg-accent`, `text-accent-foreground`
- Card：`bg-card`, `text-card-foreground`

### 字体

- **sans**：Inter Variable (通过 CSS 变量 `--font-sans`)
- **mono**：JetBrains Mono (通过 CSS 变量 `--font-mono`)
- **brand**：Poppins (通过 CSS 变量 `--font-brand`)
- 标题：text-3xl, font-bold
- 副标题：text-lg
- 正文：text-sm

### 间距

- 侧边栏内边距：p-2
- 导航项间距：gap-1
- 主内容区内边距：px-6 py-4

### 圆角

使用 shadcn radius 系统：
- `--radius`: 0.625rem (默认)
- `--radius-sm`: calc(var(--radius) * 0.6)
- `--radius-lg`: var(--radius)
- `--radius-xl`: calc(var(--radius) * 1.4)

## 交互规范

### 侧边栏折叠

- 点击切换按钮展开/折叠
- 折叠动画：width transition 200ms ease
- 展开状态默认

### 输入框

- 回车键触发发送
- 发送按钮点击触发发送
- 空内容时发送按钮禁用

## 文件结构

```
apps/desktop/src/renderer/src/
├── routes/
│   └── index.tsx          # 已有，更新为新布局
├── components/
│   └── app-shell/
│       ├── index.ts
│       ├── LeftSidebar.tsx    # 新增：侧边栏组件
│       ├── TopBar.tsx         # 新增：顶部状态栏
│       ├── HeroSection.tsx    # 新增：中心引导区
│       └── InputArea.tsx     # 新增：底部输入区
```

## 实现顺序

1. LeftSidebar - 侧边栏组件
2. TopBar - 顶部状态栏
3. HeroSection - 中心引导区
4. InputArea - 底部输入区
5. 组装到 index.tsx

## 后续扩展

- 添加历史记录列表到侧边栏
- 实现建议快捷指令卡片
- 添加完整工具栏
- 实现模型选择器等功能
