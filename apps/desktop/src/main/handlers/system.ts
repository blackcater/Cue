import type { Rpc, RpcServer } from '@/shared/rpc'

import { WindowManager } from '../services'

export async function registerSystemHandlers(
	server: RpcServer,
	windowManager: WindowManager
) {
	const router = server.router('system')

	router.handle('window/create-vault', ((_, vaultId: string) => {
		windowManager.createVaultWindow(vaultId)
		windowManager.closeWindow('welcome')
		return { ok: true }
	}) as Rpc.HandlerFn)

	router.handle('window/create-popup', ((_, threadId: string) => {
		windowManager.createChatPopupWindow(threadId)
		return { ok: true }
	}) as Rpc.HandlerFn)
}
