import { WindowsNewIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { PanelHeader } from '../shared'

interface BrowserWindowManagerHeaderProps {
	windowCount: number
	onNewWindow: () => void
}

export function BrowserWindowManagerHeader({
	windowCount,
	onNewWindow,
}: BrowserWindowManagerHeaderProps) {
	return (
		<PanelHeader
			iconNode={
				<HugeiconsIcon
					icon={WindowsNewIcon}
					className="h-3 w-3 shrink-0 text-sky-600/70"
				/>
			}
			label={`Browser${windowCount > 0 ? ` (${windowCount})` : ''}`}
		>
			<button
				onClick={onNewWindow}
				className="text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-75"
				title="New browser window"
			>
				<span className="text-sm font-medium">+</span>
			</button>
		</PanelHeader>
	)
}
