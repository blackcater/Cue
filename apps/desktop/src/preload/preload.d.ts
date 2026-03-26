import type { ElectronAPI } from '@electron-toolkit/preload'

import type { IpcRendererRpcClient } from '../shared/rpc/electron'

interface API {
	getRpcClient(): IpcRendererRpcClient
}

declare global {
	interface Window {
		electron: ElectronAPI
		api: API
	}
}
