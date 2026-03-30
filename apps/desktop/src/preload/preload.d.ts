import type { RpcClient } from '@/shared/rpc'
import type { IpcRendererRpcClient } from '@/shared/rpc/electron'

interface API {
	rpc: RpcClient
}

declare global {
	interface Window {
		api: API
	}
}
