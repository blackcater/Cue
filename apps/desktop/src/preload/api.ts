import { contextBridge } from 'electron'

import type { API } from './preload'
import { createRpc } from './utils'

// Create singleton RPC client instance
const rpc = createRpc()

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
