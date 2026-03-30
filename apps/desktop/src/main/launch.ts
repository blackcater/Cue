import { app, ipcMain } from 'electron'

import {
	WindowRegistryImpl,
	ElectronRpcServer,
	type WindowRegistry,
} from '@/shared/rpc'
import icon from '~/resources/icon.png?asset'

import { mainLog } from './lib/logger'
import { is, platform, setAppUserModelId } from './lib/utils'
import { RpcDebugService, WindowManager } from './services'

export async function launch() {
	let windowManager: WindowManager | null = null
	let windowRegistry: WindowRegistry | null = null
	let rpcServer: ElectronRpcServer | null = null
	let mainWindow: Electron.BrowserWindow | null = null

	setAppUserModelId('dev.blackcater.acme')

	if (platform.isMacOS && app.dock && is.dev) {
		app.dock.setIcon(icon)
	}

	// Initialize WindowManager
	windowManager = new WindowManager()
	mainLog.info('WindowManager initialized')

	// Initialize WindowRegistry and ElectronRpcServer
	windowRegistry = new WindowRegistryImpl()
	rpcServer = new ElectronRpcServer(windowRegistry, ipcMain)
	mainLog.info('RPC server initialized')

	// Add window:create IPC handler for BrowserWindow creation
	ipcMain.handle('window:create', async (_, groupId: string | null) => {
		const { window, clientId } = windowManager!.createDebugWindow()
		windowRegistry!.registerWindow(window, groupId ?? undefined)
		return { clientId, windowId: window.id }
	})

	// Register debug handlers
	new RpcDebugService(rpcServer, windowRegistry, windowManager)
	mainLog.info('RPC debug handlers registered')

	// Create the main window
	mainWindow = windowManager.createWindow()
	windowRegistry.registerWindow(mainWindow)
	mainLog.info('Main window created and registered')

	const refreshBound = (timeout = 0) => {
		setTimeout(() => {
			if (mainWindow.isDestroyed()) return
			// FIXME: workaround for theme bug in full screen mode
			const size = mainWindow.getSize()
			mainWindow.setSize(size[0] + 1, size[1] + 1)
			mainWindow.setSize(size[0], size[1])
		}, timeout)
	}

	// Handle app activation (for macOS Dock click)
	app.on('activate', () => {
		mainLog.info('App activated')
		refreshBound()
		refreshBound(1000)
	})

	mainWindow.on('leave-full-screen', () => {
		refreshBound()
		refreshBound(1000)
	})
}
