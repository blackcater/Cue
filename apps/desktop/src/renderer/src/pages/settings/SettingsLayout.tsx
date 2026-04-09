import { SettingsNav } from '../../components/settings/SettingsNav'

export interface SettingsLayoutProps {
	children: React.ReactNode
}

export function SettingsLayout({ children }: Readonly<SettingsLayoutProps>) {
	return (
		<div className="flex h-full w-full">
			<SettingsNav />
			<div className="flex h-full w-full flex-1 flex-col overflow-hidden py-1 pr-1">
				<main className="bg-background h-full w-full rounded-lg">
					{children}
				</main>
			</div>
		</div>
	)
}
