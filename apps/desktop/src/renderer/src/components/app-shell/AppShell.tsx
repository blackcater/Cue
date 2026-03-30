import { cn } from '@acme-ai/ui/lib/utils'

import { is } from '@renderer/lib/electron'

interface AppShellProps {
	enableNoise?: boolean
	children: React.ReactNode
}

export function AppShell({
	enableNoise = true,
	children,
}: Readonly<AppShellProps>) {
	return (
		<div
			className={cn(
				'relative flex h-screen flex-col',
				is.macOS ? 'bg-transparent' : 'bg-sidebar',
				is.electron && enableNoise && 'noise'
			)}
		>
			{children}
		</div>
	)
}
