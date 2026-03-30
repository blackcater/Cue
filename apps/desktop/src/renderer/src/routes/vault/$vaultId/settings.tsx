import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/vault/$vaultId/settings')({
	component: SettingsPage,
})

function SettingsPage() {
	return <div>Vault Settings</div>
}
