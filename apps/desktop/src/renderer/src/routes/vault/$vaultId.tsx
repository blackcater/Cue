import { createFileRoute, Outlet } from '@tanstack/react-router'

import { VaultLayout } from '@renderer/pages/vault/VaultLayout'

export const Route = createFileRoute('/vault/$vaultId')({
	component: VaultDefaultLayout,
})

function VaultDefaultLayout() {
	return (
		<VaultLayout>
			<Outlet />
		</VaultLayout>
	)
}
