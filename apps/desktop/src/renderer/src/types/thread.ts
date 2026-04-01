export interface Thread {
  id: string
  title: string
  projectId: string
  updatedAt: Date
  createdAt: Date
  isPinned: boolean
}

export type ThreadSortField = 'updatedAt' | 'createdAt'
export type ThreadSortOrder = 'asc' | 'desc'
