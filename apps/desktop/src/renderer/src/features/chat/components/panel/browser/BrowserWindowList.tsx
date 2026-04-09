import { useAtomValue } from 'jotai'

import { browserInstancesAtom } from '@renderer/stores/browser.atoms'

import { BrowserWindowItem } from './BrowserWindowItem'

interface BrowserWindowListProps {
	onFocusInstance: (instanceId: string) => void
	onCloseInstance: (instanceId: string) => void
}

export function BrowserWindowList({
	onFocusInstance,
	onCloseInstance,
}: BrowserWindowListProps) {
	const instances = useAtomValue(browserInstancesAtom)

	if (instances.length === 0) {
		return (
			<div className="text-muted-foreground flex h-full items-center justify-center text-xs">
				No browser windows open
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-0.5 p-1.5">
			{instances.map((instance) => (
				<BrowserWindowItem
					key={instance.id}
					instance={instance}
					onFocus={() => onFocusInstance(instance.id)}
					onClose={() => onCloseInstance(instance.id)}
				/>
			))}
		</div>
	)
}
