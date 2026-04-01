import { atomWithStorage } from 'jotai/utils'

import type { Project } from '../types/project'
import type { SidebarState } from '../types/sidebar'
import type { Thread } from '../types/thread'

export const sidebarAtom = atomWithStorage<SidebarState>('sidebar-state', {
	collapsed: false,
	width: 256,
	viewMode: 'folder',
	sortOrder: 'desc',
	sortField: 'updatedAt',
})

export const projectsAtom = atomWithStorage<Project[]>('projects', [])

export const threadsAtom = atomWithStorage<Thread[]>('threads', [])

export const pinnedThreadsAtom = atomWithStorage<Set<string>>(
	'pinned-threads',
	new Set<string>()
)
