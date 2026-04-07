import { createFileRoute, Outlet } from '@tanstack/react-router'

import { SettingsLayout } from '@renderer/features/settings/pages/SettingsLayout'

export const Route = createFileRoute('/vault/settings')({
	component: SettingsDefaultLayout,
})

function SettingsDefaultLayout() {
	return (
		<SettingsLayout>
			<Outlet />
		</SettingsLayout>
	)
}
