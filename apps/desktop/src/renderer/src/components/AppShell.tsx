import { cn } from '@acme-ai/ui'

import { Environment } from '@renderer/lib/env'

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
				Environment.isMacOS ? 'bg-transparent' : 'bg-sidebar',
				Environment.isElectron && enableNoise && 'noise'
			)}
		>
			{children}
		</div>
	)
}
