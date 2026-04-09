import {
	ArrowLeftIcon,
	ArrowRightIcon,
	Cancel01Icon,
	RefreshIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { browserApi } from '@renderer/api'
import type { BrowserInstanceInfo } from '@renderer/stores/browser.atoms'

interface BrowserWindowItemProps {
	instance: BrowserInstanceInfo
	onFocus: () => void
	onClose: () => void
}

export function BrowserWindowItem({
	instance,
	onFocus,
	onClose,
}: BrowserWindowItemProps) {
	const handleGoBack = async (e: React.MouseEvent) => {
		e.stopPropagation()
		if (instance.canGoBack) {
			await browserApi.goBack(instance.id)
		}
	}

	const handleGoForward = async (e: React.MouseEvent) => {
		e.stopPropagation()
		if (instance.canGoForward) {
			await browserApi.goForward(instance.id)
		}
	}

	const handleReload = async (e: React.MouseEvent) => {
		e.stopPropagation()
		await browserApi.reload(instance.id)
	}

	const handleClose = async (e: React.MouseEvent) => {
		e.stopPropagation()
		await browserApi.destroy(instance.id)
		onClose()
	}

	return (
		<div
			onClick={onFocus}
			className="group hover:border-border hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5"
		>
			{/* Favicon */}
			<div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden">
				{instance.favicon ? (
					<img
						src={instance.favicon}
						alt=""
						className="h-full w-full object-contain"
					/>
				) : (
					<div className="bg-muted h-full w-full rounded-sm" />
				)}
			</div>

			{/* Title and URL */}
			<div className="flex min-w-0 flex-1 flex-col">
				<span className="truncate text-[10px] leading-tight font-medium">
					{instance.title || 'Untitled'}
				</span>
				<span className="text-muted-foreground truncate text-[9px] leading-tight">
					{instance.url}
				</span>
			</div>

			{/* Loading indicator */}
			{instance.isLoading && (
				<div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-sky-500" />
			)}

			{/* Navigation controls */}
			<div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
				<button
					onClick={handleGoBack}
					disabled={!instance.canGoBack}
					className="text-muted-foreground hover:text-foreground flex h-5 w-5 items-center justify-center rounded transition-colors duration-75 disabled:opacity-30"
					title="Go back"
				>
					<HugeiconsIcon icon={ArrowLeftIcon} className="h-3 w-3" />
				</button>
				<button
					onClick={handleGoForward}
					disabled={!instance.canGoForward}
					className="text-muted-foreground hover:text-foreground flex h-5 w-5 items-center justify-center rounded transition-colors duration-75 disabled:opacity-30"
					title="Go forward"
				>
					<HugeiconsIcon icon={ArrowRightIcon} className="h-3 w-3" />
				</button>
				<button
					onClick={handleReload}
					className="text-muted-foreground hover:text-foreground flex h-5 w-5 items-center justify-center rounded transition-colors duration-75"
					title="Reload"
				>
					<HugeiconsIcon icon={RefreshIcon} className="h-3 w-3" />
				</button>
				<button
					onClick={handleClose}
					className="text-muted-foreground hover:text-destructive flex h-5 w-5 items-center justify-center rounded transition-colors duration-75"
					title="Close"
				>
					<HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
				</button>
			</div>
		</div>
	)
}
