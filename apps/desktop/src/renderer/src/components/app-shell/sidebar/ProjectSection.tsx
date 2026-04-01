import { useAtom } from 'jotai'

import { sidebarAtom } from '@renderer/atoms'

import { ThreadTitleCell } from './cell/ThreadTitleCell'
import { FlatView } from './section/FlatView'
import { FolderView } from './section/FolderView'

export function ProjectSection() {
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
		<section className="flex h-full max-w-full flex-col gap-1 px-2">
			<div className="relative flex min-h-0 flex-1 flex-col">
				<ThreadTitleCell
					title="Threads"
					onSort={handleSort}
					onAdd={handleAddFolder}
					className="sticky top-0 z-10"
				/>
				<div className="min-h-0 flex-1 overflow-y-auto">
					{viewMode === 'folder' ? <FolderView /> : <FlatView />}
				</div>
			</div>
		</section>
	)
}
