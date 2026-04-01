import { atomWithStorage } from 'jotai/utils'

import type { SidebarState } from '../types/sidebar'

export const sidebarAtom = atomWithStorage<SidebarState>('sidebar-state', {
	collapsed: false,
	width: 256,
	viewMode: 'folder',
	sortOrder: 'desc',
	sortField: 'updatedAt',
})
