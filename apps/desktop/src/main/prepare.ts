import { ipcMain } from 'electron'

import { Container } from '@/shared/di'
import { ElectronRpcServer } from '@/shared/rpc'

import { AppStore } from './lib/store'
import { WindowManager, WindowRegistry } from './services'

export async function prepare() {
	Container.singleton(AppStore)
		.singleton(WindowRegistry)
		.singleton(WindowManager)
		.singleton(ElectronRpcServer, () => {
			const windowRegistry = Container.inject(WindowRegistry)
			return new ElectronRpcServer(windowRegistry, ipcMain)
		})
}
