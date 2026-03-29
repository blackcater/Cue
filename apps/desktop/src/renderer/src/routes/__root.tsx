import { Outlet } from '@tanstack/react-router'
import { AppShell } from '../components/app-shell'

export function RootComponent(): React.JSX.Element {
	return (
		<AppShell>
			<main className="flex flex-1 flex-col">
				<Outlet />
			</main>
		</AppShell>
	)
}
