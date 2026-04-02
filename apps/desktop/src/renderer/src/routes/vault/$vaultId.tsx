import { Panel, Group, Separator } from 'react-resizable-panels'

import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useAtom } from 'jotai'

import { panelAtom } from '@renderer/atoms/panel'
import { AppHeader, AppSidebar } from '@renderer/components/app-shell'
import { PanelRouter } from '@renderer/components/app-shell/panel/PanelRouter'
import { HeaderProvider, useHeader } from '@renderer/contexts/HeaderContext'

export const Route = createFileRoute('/vault/$vaultId')({
	component: VaultLayout,
})

function VaultLayout(): React.JSX.Element {
	const [panel] = useAtom(panelAtom)
	const { content } = useHeader()

	return (
		<HeaderProvider>
			<div className="relative z-1 flex h-full w-full flex-1 flex-col">
				<AppHeader
					title={content.title}
					actions={content.actions ?? []}
				/>
				<Group orientation="horizontal">
					<Panel
						id="sidebar"
						collapsedSize={0}
						collapsible
						minSize={20}
						maxSize={50}
						defaultSize={25}
					>
						<AppSidebar />
					</Panel>

					<Separator className="hover:bg-primary/20 w-1 bg-transparent transition-colors" />

					<Panel id="main">
						<div className="flex h-full w-full flex-1 flex-col overflow-hidden py-1 pr-1">
							<main className="bg-background h-full w-full rounded-lg">
								<Outlet />
							</main>
						</div>
					</Panel>

					{!panel.collapsed && panel.type && (
						<>
							<Separator className="hover:bg-primary/20 w-1 bg-transparent transition-colors" />
							<Panel
								id="panel"
								minSize={25}
								maxSize={45}
								defaultSize={32}
							>
								<PanelRouter type={panel.type} />
							</Panel>
						</>
					)}
				</Group>
			</div>
		</HeaderProvider>
	)
}
