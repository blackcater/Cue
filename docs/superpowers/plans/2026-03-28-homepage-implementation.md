# 桌面应用主页页面实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现桌面应用主页页面，采用左右分栏布局，包含可折叠侧边栏、顶部状态栏、中心引导区和底部输入框。

**Architecture:** 采用 React 组件化架构，主页面 (index.tsx) 作为容器，使用 CSS Flexbox 实现左右分栏布局。侧边栏状态通过 useState 管理，主题跟随系统设置。

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4 (shadcn), @acme-ai/ui, lucide-react, @tanstack/react-router

---

## 文件结构

```
apps/desktop/src/renderer/src/
├── routes/
│   └── index.tsx          # 修改：更新为新布局
├── components/
│   └── app-shell/
│       ├── index.ts       # 修改：导出新组件
│       ├── LeftSidebar.tsx    # 新增：可折叠侧边栏
│       ├── TopBar.tsx         # 新增：顶部状态栏
│       ├── HeroSection.tsx    # 新增：中心引导区
│       └── InputArea.tsx      # 新增：底部输入区
```

---

## Task 1: 创建 LeftSidebar 组件

**Files:**
- Create: `apps/desktop/src/renderer/src/components/app-shell/LeftSidebar.tsx`
- Modify: `apps/desktop/src/renderer/src/components/app-shell/index.ts`

**Dependencies:** packages/ui (Button, Separator), lucide-react (Plus, Sparkles, Settings, PanelLeftClose, PanelLeft)

- [ ] **Step 1: 创建 LeftSidebar.tsx**

```tsx
import * as React from 'react'

import { cn } from '@acme-ai/ui/lib/utils'
import { Button } from '@acme-ai/ui/foundation'
import {
  Plus,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'

interface LeftSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const navItems = [
  { id: 'new-thread', label: '新线程', icon: Plus },
  { id: 'skills', label: '技能和应用', icon: Sparkles },
  { id: 'settings', label: '设置', icon: Settings },
] as const

export function LeftSidebar({ isCollapsed, onToggle }: LeftSidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-in-out',
        isCollapsed ? 'w-12' : 'w-[200px]'
      )}
    >
      {/* 侧边栏头部 */}
      <div className="flex items-center justify-between p-2">
        {!isCollapsed && (
          <span className="text-sm font-medium text-sidebar-foreground">
            Acme
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7"
          aria-label={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 导航列表 */}
      <nav className="flex-1 px-2 py-1">
        <div className="grid gap-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2 h-9',
                isCollapsed && 'justify-center px-0'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <span className="text-sm">{item.label}</span>
              )}
            </Button>
          ))}
        </div>
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: 更新 app-shell/index.ts 导出**

```ts
export { LeftSidebar } from './LeftSidebar'
```

- [ ] **Step 3: 提交**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/LeftSidebar.tsx apps/desktop/src/renderer/src/components/app-shell/index.ts
git commit -m "feat(desktop): add LeftSidebar component with collapsible functionality"
```

---

## Task 2: 创建 TopBar 组件

**Files:**
- Create: `apps/desktop/src/renderer/src/components/app-shell/TopBar.tsx`
- Modify: `apps/desktop/src/renderer/src/components/app-shell/index.ts`

**Dependencies:** packages/ui (Badge)

- [ ] **Step 1: 创建 TopBar.tsx**

```tsx
import * as React from 'react'

import { cn } from '@acme-ai/ui/lib/utils'
import { Badge } from '@acme-ai/ui/foundation'

interface TopBarProps {
  className?: string
}

export function TopBar({ className }: TopBarProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between h-12 px-4 border-b border-border',
        className
      )}
    >
      {/* 左侧：当前状态 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          新线程
        </span>
      </div>

      {/* 右侧：获取 Plus 徽章 */}
      <Badge variant="default" className="bg-primary text-primary-foreground">
        获取 Plus
      </Badge>
    </header>
  )
}
```

- [ ] **Step 2: 更新 app-shell/index.ts 导出**

```ts
export { LeftSidebar } from './LeftSidebar'
export { TopBar } from './TopBar'
```

- [ ] **Step 3: 提交**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/TopBar.tsx apps/desktop/src/renderer/src/components/app-shell/index.ts
git commit -m "feat(desktop): add TopBar component with status and Plus badge"
```

---

## Task 3: 创建 HeroSection 组件

**Files:**
- Create: `apps/desktop/src/renderer/src/components/app-shell/HeroSection.tsx`
- Modify: `apps/desktop/src/renderer/src/components/app-shell/index.ts`

**Dependencies:** lucide-react (Brain, ChevronDown)

- [ ] **Step 1: 创建 HeroSection.tsx**

```tsx
import * as React from 'react'

import { cn } from '@acme-ai/ui/lib/utils'
import { Brain, ChevronDown } from 'lucide-react'

interface HeroSectionProps {
  className?: string
  projectName?: string
}

export function HeroSection({
  className,
  projectName = 'typed',
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        'flex flex-col items-center justify-center flex-1 gap-6',
        className
      )}
    >
      {/* 图标 */}
      <div className="relative">
        <Brain className="h-16 w-16 text-muted-foreground" />
      </div>

      {/* 标题 */}
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold text-foreground">
          开始构建
        </h1>
        <button className="flex items-center gap-1 text-lg text-muted-foreground hover:text-foreground transition-colors">
          <span>{projectName}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: 更新 app-shell/index.ts 导出**

```ts
export { LeftSidebar } from './LeftSidebar'
export { TopBar } from './TopBar'
export { HeroSection } from './HeroSection'
```

- [ ] **Step 3: 提交**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/HeroSection.tsx apps/desktop/src/renderer/src/components/app-shell/index.ts
git commit -m "feat(desktop): add HeroSection component with centered content"
```

---

## Task 4: 创建 InputArea 组件

**Files:**
- Create: `apps/desktop/src/renderer/src/components/app-shell/InputArea.tsx`
- Modify: `apps/desktop/src/renderer/src/components/app-shell/index.ts`

**Dependencies:** packages/ui (Input, Button), lucide-react (ArrowUp)

- [ ] **Step 1: 创建 InputArea.tsx**

```tsx
import * as React from 'react'

import { cn } from '@acme-ai/ui/lib/utils'
import { Button } from '@acme-ai/ui/foundation'
import { ArrowUp } from 'lucide-react'

interface InputAreaProps {
  className?: string
  onSend?: (message: string) => void
}

export function InputArea({ className, onSend }: InputAreaProps) {
  const [value, setValue] = React.useState('')

  const handleSend = () => {
    if (value.trim() && onSend) {
      onSend(value.trim())
      setValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-3 border-t border-border',
        className
      )}
    >
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入指令、使用 @ 引用文件、使用 / 调用命令、使用 $ 调用技能"
          className={cn(
            'w-full h-10 pl-3 pr-10 rounded-full bg-input text-sm text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
      </div>
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!value.trim()}
        className={cn(
          'h-9 w-9 rounded-full shrink-0',
          !value.trim() && 'opacity-50 cursor-not-allowed'
        )}
        aria-label="发送"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: 更新 app-shell/index.ts 导出**

```ts
export { LeftSidebar } from './LeftSidebar'
export { TopBar } from './TopBar'
export { HeroSection } from './HeroSection'
export { InputArea } from './InputArea'
```

- [ ] **Step 3: 提交**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/InputArea.tsx apps/desktop/src/renderer/src/components/app-shell/index.ts
git commit -m "feat(desktop): add InputArea component with pill-shaped input"
```

---

## Task 5: 组装主页面 index.tsx

**Files:**
- Modify: `apps/desktop/src/renderer/src/routes/index.tsx`

**Dependencies:** app-shell components (LeftSidebar, TopBar, HeroSection, InputArea)

- [ ] **Step 1: 更新 index.tsx**

```tsx
import * as React from 'react'

import { cn } from '@acme-ai/ui/lib/utils'
import {
  LeftSidebar,
  TopBar,
  HeroSection,
  InputArea,
} from '../components/app-shell'

export function HomePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* 左侧可折叠侧边栏 */}
      <LeftSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* 右侧主内容区 */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* 顶部状态栏 */}
        <TopBar className="shrink-0" />

        {/* 中心引导区 */}
        <HeroSection className="flex-1" />

        {/* 底部输入区 */}
        <InputArea className="shrink-0" />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: 运行类型检查**

```bash
cd /Users/blackcater/Workspace/Codes/Labs/Acme && bunx tsc --noEmit --project apps/desktop/tsconfig.json
```

预期：无错误输出

- [ ] **Step 3: 提交**

```bash
git add apps/desktop/src/renderer/src/routes/index.tsx
git commit -m "feat(desktop): update HomePage with new layout structure"
```

---

## 实现验证

完成所有任务后，运行以下命令验证：

```bash
# 1. 类型检查
bunx tsc --noEmit --project apps/desktop/tsconfig.json

# 2. 启动开发服务器
cd apps/desktop && bun run dev
```

---

## 后续扩展

完成基础布局后，可以考虑以下扩展：

1. **添加历史记录列表** - 在侧边栏中部添加线程历史记录
2. **实现建议快捷指令卡片** - 在 HeroSection 下方添加三个并排的卡片
3. **添加完整工具栏** - 在 TopBar 中添加工具按钮
4. **实现模型选择器** - 在 InputArea 左侧添加模型选择下拉菜单
