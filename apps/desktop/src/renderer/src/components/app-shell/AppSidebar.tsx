import { ScrollArea } from '@acme-ai/ui/foundation'
import { useAtom } from 'jotai'

import { sidebarAtom } from '@renderer/atoms'

import { PinnedSection } from './sidebar/PinnedSection'
import { ProjectSection } from './sidebar/ProjectSection'
import { SidebarFooter } from './sidebar/SidebarFooter'
import { SidebarHeader } from './sidebar/SidebarHeader'
import { ThreadTitleCell } from './sidebar/cell/ThreadTitleCell'

export function AppSidebar(): React.JSX.Element {
	const [sidebar, setSidebar] = useAtom(sidebarAtom)
	const viewMode = sidebar.viewMode

	const handleSort = () => {
		if (viewMode === 'folder') {
			setSidebar({ ...sidebar, viewMode: 'flat' })
		} else if (viewMode === 'flat') {
			setSidebar({ ...sidebar, viewMode: 'folder' })
		}
	}

	const handleAddFolder = () => {
		// TODO: Add Project
	}

	return (
		<aside className="text-secondary-foreground relative flex h-full w-[256px] shrink-0 flex-col overflow-hidden">
			<SidebarHeader />
			<PinnedSection />
			<ThreadTitleCell
				title="Threads"
				onSort={handleSort}
				onAdd={handleAddFolder}
			/>
			<ScrollArea className="min-h-0 flex-1">
				<ProjectSection />
			</ScrollArea>
			<SidebarFooter />
		</aside>
	)
}
