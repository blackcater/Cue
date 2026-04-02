import { useAtom, useAtomValue, useSetAtom } from 'jotai'

import {
	openedProjectIdsAtom,
	projectsAtom,
	sidebarAtom,
} from '@renderer/atoms'

import { ThreadTitleCell } from './cell/ThreadTitleCell'
import { FlatView } from './section/FlatView'
import { FolderView } from './section/FolderView'

export function ProjectSection() {
	const [sidebar] = useAtom(sidebarAtom)
	const projects = useAtomValue(projectsAtom)
	const setOpenedProjectIds = useSetAtom(openedProjectIdsAtom)
	const organizeMode = sidebar.organizeMode

	const handleCollapseAll = () => {
		setOpenedProjectIds(new Set(projects.map((p) => p.id)))
	}

	const handleExpandAll = () => {
		setOpenedProjectIds(new Set())
	}

	const handleAddFolder = () => {
		// TODO: Add Project
		console.log('Add folder clicked')
	}

	// FolderCell 菜单处理
	const handleMenuOpenInFinder = (id: string) => {
		console.log('Open in Finder:', id)
	}

	const handleMenuCreateWorktree = (id: string) => {
		console.log('Create worktree:', id)
	}

	const handleMenuEditName = (id: string) => {
		console.log('Edit name:', id)
	}

	const handleMenuArchiveThreads = (id: string) => {
		console.log('Archive threads:', id)
	}

	const handleMenuDelete = (id: string) => {
		console.log('Delete:', id)
	}

	return (
		<div className="flex h-full max-w-full flex-col px-2 pb-4">
			<ThreadTitleCell
				title="Threads"
				onCollapseAll={handleCollapseAll}
				onExpandAll={handleExpandAll}
				onAdd={handleAddFolder}
			/>
			{organizeMode === 'folder' ? (
				<FolderView
					onMenuOpenInFinder={handleMenuOpenInFinder}
					onMenuCreateWorktree={handleMenuCreateWorktree}
					onMenuEditName={handleMenuEditName}
					onMenuArchiveThreads={handleMenuArchiveThreads}
					onMenuDelete={handleMenuDelete}
				/>
			) : (
				<FlatView />
			)}
		</div>
	)
}
