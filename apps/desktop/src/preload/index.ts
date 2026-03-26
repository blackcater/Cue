import { contextBridge, ipcRenderer } from 'electron'

import { electronAPI } from '@electron-toolkit/preload'

import { IpcRendererRpcClient } from '../shared/rpc/electron'

// Create singleton RPC client instance
const rpcClient = new IpcRendererRpcClient(ipcRenderer)

// Expose API - contextBridge only copies enumerable own properties
const api = {
	getRpcClient: () => ({
		clientId: rpcClient.clientId,
		groupId: rpcClient.groupId,
		call: rpcClient.call.bind(rpcClient),
		stream: rpcClient.stream.bind(rpcClient),
		onEvent: rpcClient.onEvent.bind(rpcClient),
	}),
}

if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('electron', electronAPI)
		contextBridge.exposeInMainWorld('api', api)
	} catch (error) {
		console.error(error)
	}
}
