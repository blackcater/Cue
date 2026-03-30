import type { RpcServer } from '@/shared/rpc'

import { WindowManager } from '../services'
import { registerSystemHandlers } from './system'

export async function registerHandlers(
	server: RpcServer,
	windowManager: WindowManager
) {
	await registerSystemHandlers(server, windowManager)
}
