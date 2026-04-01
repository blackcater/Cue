import { atom } from 'jotai'
import type { Thread, ThreadSortField, ThreadSortOrder } from '../types/thread'
import { sidebarAtom } from './sidebar'
import { projectsAtom } from './project'

// All threads - base data
export const threadsAtom = atom<Thread[]>([])

// Pinned thread IDs - ordered array
export const pinnedThreadIdsAtom = atom<string[]>([])

// Derived: pinned threads (maintains order from pinnedThreadIdsAtom)
export const pinnedThreadsAtom = atom((get) => {
  const threads = get(threadsAtom)
  const pinnedIds = get(pinnedThreadIdsAtom)
  return pinnedIds
    .map(id => threads.find(t => t.id === id))
    .filter((t): t is Thread => t != null)
})

// Derived: unpinned threads for flat view, sorted by sidebar preferences
export const flatThreadsAtom = atom((get) => {
  const threads = get(threadsAtom)
  const pinnedIds = get(pinnedThreadIdsAtom)
  const sidebar = get(sidebarAtom)

  const unpinned = threads.filter(t => !pinnedIds.includes(t.id))

  return [...unpinned].sort((a, b) => {
    const field: ThreadSortField = sidebar.sortField
    const order: ThreadSortOrder = sidebar.sortOrder === 'asc' ? 1 : -1
    const aVal = field === 'updatedAt' ? a.updatedAt.getTime() : a.createdAt.getTime()
    const bVal = field === 'updatedAt' ? b.updatedAt.getTime() : b.createdAt.getTime()
    return (aVal - bVal) * order
  })
})

// Derived: project tree with threads, sorted by sidebar preferences
export const projectTreeAtom = atom((get) => {
  const threads = get(threadsAtom)
  const pinnedIds = get(pinnedThreadIdsAtom)
  const projects = get(projectsAtom)
  const sidebar = get(sidebarAtom)

  return projects.map((project) => ({
    project,
    threads: threads
      .filter(t => t.projectId === project.id && !pinnedIds.includes(t.id))
      .sort((a, b) => {
        const field: ThreadSortField = sidebar.sortField
        const order: ThreadSortOrder = sidebar.sortOrder === 'asc' ? 1 : -1
        const aVal = field === 'updatedAt' ? a.updatedAt.getTime() : b.createdAt.getTime()
        const bVal = field === 'updatedAt' ? b.updatedAt.getTime() : b.createdAt.getTime()
        return (aVal - bVal) * order
      }),
  }))
})
