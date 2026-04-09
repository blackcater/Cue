import { GitBranchIcon, RefreshIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { PanelHeader } from '../shared'

interface GitPanelHeaderProps {
	branch?: string
	onRefresh: () => void
	loading?: boolean
}

export function GitPanelHeader({
	branch,
	onRefresh,
	loading,
}: GitPanelHeaderProps) {
	return (
		<PanelHeader
			iconNode={
				<HugeiconsIcon
					icon={GitBranchIcon}
					className="h-3 w-3 shrink-0 text-emerald-600/70"
				/>
			}
			label={branch || 'No branch'}
		>
			<button
				onClick={onRefresh}
				disabled={loading}
				className="text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-75 disabled:opacity-50"
				title="Refresh"
			>
				<HugeiconsIcon
					icon={RefreshIcon}
					className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}
				/>
			</button>
		</PanelHeader>
	)
}
