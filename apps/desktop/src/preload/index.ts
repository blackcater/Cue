import { contextBridge, ipcRenderer } from 'electron'

import { electronAPI } from '@electron-toolkit/preload'

import { IpcRendererRpcClient } from '../shared/rpc/electron'

// Lazy-initialized RPC client
let rpcClient: IpcRendererRpcClient | null = null

const api = {
	// Factory function to create/retrieve RPC client
	// Uses IpcRendererRpcClient which works in renderer context
	getRpcClient: () => {
		if (!rpcClient) {
			rpcClient = new IpcRendererRpcClient(ipcRenderer)
		}
		return rpcClient
	},
}

if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('electron', electronAPI)
		contextBridge.exposeInMainWorld('api', api)
	} catch (error) {
		console.error(error)
	}
}
