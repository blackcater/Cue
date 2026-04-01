import { atomWithStorage } from 'jotai/utils'
import type { SidebarState } from '../types/sidebar'

export const sidebarAtom = atomWithStorage<SidebarState>('sidebar-state', {
	collapsed: false,
	width: 256,
	viewMode: 'folder',
	sortOrder: 'desc',
	sortField: 'updatedAt',
})

export interface Project {
	id: string
	title: string
}

export const projectsAtom = atomWithStorage<Project[]>('projects', [])

export interface Thread {
	id: string
	projectId: string
	title: string
	updatedAt: Date
	createdAt: Date
}

export const threadsAtom = atomWithStorage<Thread[]>('threads', [])

export const pinnedThreadsAtom = atomWithStorage<Set<string>>(
	'pinned-threads',
	new Set<string>()
)
