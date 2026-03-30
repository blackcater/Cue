import { contextBridge, ipcRenderer } from 'electron'

import { IpcRendererRpcClient } from '@/shared/rpc/electron'

import type { API } from './preload'

// Create singleton RPC client instance
const rpc = new IpcRendererRpcClient(ipcRenderer)

const api: API = {
	rpc,
}

if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('api', api)
	} catch (error) {
		console.error(error)
	}
}
