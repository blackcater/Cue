export interface Plugin {
  id: string
  name: string
  version: string
  enabled: boolean
  onLoad?: () => Promise<void>
  onUnload?: () => Promise<void>
}
