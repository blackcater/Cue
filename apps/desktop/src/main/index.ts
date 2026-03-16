import { app } from 'electron'

import { electronApp, is, platform } from '@electron-toolkit/utils'

import icon from '~/resources/icon.png?asset'

import { log, mainLog } from './lib/logger'
import { WindowManager } from './services/WindowManager'

log.initialize()

let windowManager: WindowManager | null = null

app.on('open-url', (event, url) => {
	event.preventDefault()
	mainLog.info('Received deeplink:', url)
})

app.whenReady().then(() => {
	electronApp.setAppUserModelId('dev.blackcater.acme')

	if (platform.isMacOS && app.dock && is.dev) {
		app.dock.setIcon(icon)
	}

	windowManager = new WindowManager()
})

app.on('window-all-closed', () => {
	app.quit()
})
