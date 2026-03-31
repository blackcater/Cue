import { Button } from '@acme-ai/ui/foundation'
import {
	CollapseIcon,
	ExpandIcon,
	FilterMailIcon,
	FolderAddIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { TitleCell } from './TitleCell'

interface Props {
	title: string
	onSort?: () => void
	onAdd?: () => void
	className?: string
}

export function ThreadTitleCell({
	title,
	onSort,
	onAdd,
	...props
}: Readonly<Props>) {
	const isAllFolderExpanded = true // TODO: 从 state 中获取

	return (
		<TitleCell title={title} {...props}>
			{isAllFolderExpanded && (
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Collapse All"
				>
					<HugeiconsIcon icon={CollapseIcon} className="size-3.5" />
				</Button>
			)}
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={(e) => {
					e.stopPropagation()
					onSort?.()
				}}
				aria-label="Sort"
			>
				<HugeiconsIcon icon={FilterMailIcon} className="size-3.5" />
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={(e) => {
					e.stopPropagation()
					onAdd?.()
				}}
				aria-label="Add"
			>
				<HugeiconsIcon icon={FolderAddIcon} className="size-3.5" />
			</Button>
		</TitleCell>
	)
}
