import { useAtom } from 'jotai'

import { Outlet } from '@tanstack/react-router'

import { VaultSelector, ProjectTree } from '../components/sidebar'
import { Toolbar } from '../components/toolbar'
import { activePanelAtom, threadIdAtom, vaultIdAtom } from '../atoms'

export function RootComponent(): React.JSX.Element {
	const [vaultId, setVaultId] = useAtom(vaultIdAtom)
	const [threadId, setThreadId] = useAtom(threadIdAtom)
	const [activePanel, setActivePanel] = useAtom(activePanelAtom)

	return (
		<div className="flex h-screen">
			{/* Left Sidebar */}
			<aside className="flex h-full w-[260px] flex-col border-r border-border bg-sidebar">
				{/* Vault Selector */}
				<div className="border-b border-border p-3">
					<VaultSelector selectedVaultId={vaultId} onVaultSelect={setVaultId} />
				</div>

				{/* Project Tree */}
				<div className="flex-1 overflow-y-auto">
					<ProjectTree
						vaultId={vaultId ?? ''}
						selectedThreadId={threadId}
						onThreadSelect={setThreadId}
					/>
				</div>
			</aside>

			{/* Main Content Area */}
			<main className="flex flex-1 flex-col">
				<Outlet />
			</main>

			{/* Right Toolbar */}
			<Toolbar activePanel={activePanel} onPanelChange={setActivePanel} />
		</div>
	)
}
