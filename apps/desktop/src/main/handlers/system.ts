import { Container } from '@/shared/di'
import { ElectronRpcServer } from '@/shared/rpc'

import { WindowManager } from '../services'

export async function registerSystemHandlers() {
	const server = Container.inject(ElectronRpcServer)
	const windowManager = Container.inject(WindowManager)

	const router = server.router('system')

	router.handle('window/create-vault', (_, vaultId: string) => {
		windowManager.createVaultWindow(vaultId)
		windowManager.closeWindow('welcome')
		return { ok: true }
	})

	router.handle('window/create-popup', (_, threadId: string) => {
		windowManager.createChatPopupWindow(threadId)
		return { ok: true }
	})
}
