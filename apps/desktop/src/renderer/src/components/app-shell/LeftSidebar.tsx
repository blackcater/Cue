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
			{/* Sidebar header */}
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

			{/* Navigation list */}
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
