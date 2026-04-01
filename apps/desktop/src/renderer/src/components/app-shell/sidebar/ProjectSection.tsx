import { useAtomValue } from 'jotai'

import { sidebarAtom } from '@renderer/atoms'

import { FlatView } from './section/FlatView'
import { FolderView } from './section/FolderView'

export function ProjectSection() {
	const sidebar = useAtomValue(sidebarAtom)
	const viewMode = sidebar.viewMode

	return (
		<div className="flex h-full max-w-full flex-col gap-1 px-2">
			{viewMode === 'folder' ? <FolderView /> : <FlatView />}
		</div>
	)
}
