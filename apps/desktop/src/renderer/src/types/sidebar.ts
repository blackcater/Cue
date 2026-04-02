export type OrganizeMode = 'folder' | 'flat'
export type SortBy = 'updatedAt' | 'createdAt'
export type ShowMode = 'all' | 'relevant'

export interface SidebarState {
  collapsed: boolean
  width: number
  organizeMode: OrganizeMode
  sortBy: SortBy
  showMode: ShowMode
}
