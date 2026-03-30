import { ipcRenderer } from 'electron'

import type { RpcClient } from '@/shared/rpc'
import { IpcRendererRpcClient } from '@/shared/rpc/electron'

export function createRpc(): RpcClient {
	const rpc = new IpcRendererRpcClient(ipcRenderer)

	return {
		clientId: rpc.clientId,
		groupId: rpc.groupId,
		call: (event: string, ...args: any[]) => rpc.call(event, ...args),
		stream: (event: string, ...args: any[]) => rpc.stream(event, ...args),
		onEvent: (event: string, listener: any) => rpc.onEvent(event, listener),
	} as any satisfies RpcClient
}
