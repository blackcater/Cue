import type { RpcServer } from '@/shared/rpc'

import { registerSystemHandlers } from './system'

export async function registerHandlers(server: RpcServer) {
	await registerSystemHandlers(server)
}
