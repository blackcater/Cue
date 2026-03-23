import { join } from 'node:path'

import { BrowserWindow, shell } from 'electron'

import { is } from '@electron-toolkit/utils'
import { MessageChannelRouter } from '@main/ipc/router'
import { windowLog } from '@main/lib/logger'

import icon from '~/resources/icon.png?asset'

export class WindowManager {
	private router: MessageChannelRouter
	private windowIds = new Map<BrowserWindow, string>()

	constructor(router: MessageChannelRouter) {
		this.router = router
	}

	createWindow(): BrowserWindow {
		const mainWindow = new BrowserWindow({
			width: 900,
			height: 670,
			show: false,
			autoHideMenuBar: true,
			...(process.platform === 'linux' ? { icon } : {}),
			webPreferences: {
				preload: join(__dirname, '../preload/index.js'),
				sandbox: false,
			},
			titleBarStyle: 'hidden',
		})

		mainWindow.on('ready-to-show', () => {
			mainWindow.show()
		})

		mainWindow.webContents.setWindowOpenHandler((details) => {
			shell.openExternal(details.url)
			return { action: 'deny' }
		})

		if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
			mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
		} else {
			mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
		}

		// Setup MessageChannel router for this window
		const windowId = this.router.setupWindow(mainWindow)
		this.windowIds.set(mainWindow, windowId)
		windowLog.debug(`Window created with ID: ${windowId}`)

		// Cleanup when window closes
		mainWindow.on('closed', () => {
			const id = this.windowIds.get(mainWindow)
			if (id) {
				this.router.removeWindow(id)
				this.windowIds.delete(mainWindow)
				windowLog.debug(`Window cleaned up: ${id}`)
			}
		})

		return mainWindow
	}
}
