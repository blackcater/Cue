import { createFileRoute } from '@tanstack/react-router'

import { AppHeader, AppSidebar } from '@renderer/components/app-shell'

export const Route = createFileRoute('/vault/$vaultId/_vaultLayout')({
	component: VaultLayout,
})

function VaultLayout() {
	return (
		<>
			<AppHeader />
			<div className="flex flex-1 overflow-hidden">
				<AppSidebar />
				<main className="bg-background flex-1 overflow-auto"></main>
			</div>
		</>
	)
}
