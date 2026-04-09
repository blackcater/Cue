import { ListTreeIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { PanelHeader } from '../shared'

interface OutlinePanelHeaderProps {
	totalCount: number
}

export function OutlinePanelHeader({ totalCount }: OutlinePanelHeaderProps) {
	return (
		<PanelHeader
			iconNode={
				<HugeiconsIcon
					icon={ListTreeIcon}
					className="h-3 w-3 shrink-0 text-violet-600/70"
				/>
			}
			label="Outline"
		>
			<span className="text-muted-foreground text-[10px] font-medium">
				{totalCount} items
			</span>
		</PanelHeader>
	)
}
