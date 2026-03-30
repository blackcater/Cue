import { ipcMain } from 'electron'

import { Container } from '@/shared/di'
import { ElectronRpcServer } from '@/shared/rpc'

import { WindowManager, WindowRegistry } from './services'

export async function prepare() {
	Container.singleton(WindowRegistry)
		.singleton(WindowManager)
		.singleton(ElectronRpcServer, () => {
			const windowRegistry = Container.inject(WindowRegistry)
			return new ElectronRpcServer(windowRegistry, ipcMain)
		})
}
