import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@acme-ai/ui/foundation'
import { cn } from '@acme-ai/ui/lib/utils'
import {
	Folder01Icon,
	ArrowDown01Icon,
	ArrowRight01Icon,
	PlusSignIcon,
	MoreHorizontalIcon,
	Folder02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { Cell, CellIcon, CellName, CellActions } from './Cell'

export interface ProjectCellProps {
	id: string
	title: string
	isExpanded: boolean
	onToggle: (id: string) => void
	onAddThread?: (folderId: string) => void
	onRename?: (folderId: string) => void
	onDelete?: (folderId: string) => void
	className?: string
	dropPosition?: 'before' | 'after' | null
	isDragging?: boolean
}

export function ProjectCell({
	id,
	title,
	isExpanded,
	onToggle,
	onAddThread,
	onRename,
	onDelete,
	className,
	dropPosition,
	isDragging,
}: Readonly<ProjectCellProps>) {
	return (
		<div className="relative">
			{/* Drop indicator line */}
			{dropPosition === 'before' && (
				<div className="bg-primary/30 absolute -top-0.5 right-2 left-2 z-10 h-0.5" />
			)}
			{dropPosition === 'after' && (
				<div className="bg-primary/30 absolute right-2 -bottom-0.5 left-2 z-10 h-0.5" />
			)}
			<Cell
				className={cn(
					'hover:bg-black/10 dark:hover:bg-white/10',
					isDragging && 'opacity-50',
					className
				)}
			>
				{/* 左侧图标 */}
				<CellIcon
					className="cursor-pointer"
					onClick={(e) => {
						e.stopPropagation()
						onToggle(id)
					}}
				>
					{/* hover 展开/折叠图标 */}
					<HugeiconsIcon
						icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
						className="absolute size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
					/>
					{/* 实际的 folder 图标 */}
					<HugeiconsIcon
						icon={isExpanded ? Folder02Icon : Folder01Icon}
						className="text-foreground size-3.5 opacity-100 group-hover:opacity-0"
					/>
				</CellIcon>

				{/* 名称 */}
				<CellName>{title}</CellName>

				{/* 操作区 */}
				<CellActions className="opacity-0 group-hover:opacity-100">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								className="h-6 w-6"
							>
								<HugeiconsIcon
									icon={MoreHorizontalIcon}
									className="h-3 w-3"
								/>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onRename?.(id)}>
								Rename
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onDelete?.(id)}>
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={(e) => {
							e.stopPropagation()
							onAddThread?.(id)
						}}
						className="h-6 w-6"
					>
						<HugeiconsIcon
							icon={PlusSignIcon}
							className="h-3 w-3"
						/>
					</Button>
				</CellActions>
			</Cell>
		</div>
	)
}
