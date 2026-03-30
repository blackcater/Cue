import { createRootRoute, Outlet } from '@tanstack/react-router'

import { AppShell } from '../components/app-shell'

export const Route = createRootRoute({
	component: RootComponent,
})

function RootComponent(): React.JSX.Element {
	return (
		<AppShell>
			<Outlet />
		</AppShell>
	)
}
