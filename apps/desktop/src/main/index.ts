import { app } from 'electron'
import { join } from 'node:path'

import { electronApp, is, platform } from '@electron-toolkit/utils'

import icon from '~/resources/icon.png?asset'

import { log, mainLog } from './lib/logger'
import { WindowManager } from './services/WindowManager'
import { AgentRuntime } from '@acme-ai/runtime'
import { initAllHandlers } from '@main/ipc/handlers'
import { getRouter } from '@main/ipc/router'

log.initialize()

let windowManager: WindowManager | null = null
let runtime: AgentRuntime | null = null

app.on('open-url', (event, url) => {
	event.preventDefault()
	mainLog.info('Received deeplink:', url)
})

app.whenReady().then(() => {
	electronApp.setAppUserModelId('dev.blackcater.acme')

	if (platform.isMacOS && app.dock && is.dev) {
		app.dock.setIcon(icon)
	}

	// Initialize MessageChannelRouter
	const router = getRouter()
	mainLog.info('MessageChannelRouter initialized')

	// Initialize AgentRuntime with base path for data storage
	const basePath = join(app.getPath('userData'), 'acme-data')
	runtime = new AgentRuntime({ basePath })
	mainLog.info('AgentRuntime initialized', { basePath })

	// Register all IPC handlers
	initAllHandlers(runtime)
	mainLog.info('IPC handlers registered')

	// Initialize WindowManager with the router
	windowManager = new WindowManager(router)
	mainLog.info('WindowManager initialized')

	// Create the main window
	windowManager.createWindow()
	mainLog.info('Main window created')
}).catch((error) => {
	mainLog.error('Failed to initialize app:', error)
	app.quit()
})

app.on('window-all-closed', () => {
	// Stop all agents before quitting
	if (runtime) {
		try {
			runtime.stopAllAgents()
			mainLog.info('All agents stopped')
		} catch (error) {
			mainLog.error('Error stopping agents:', error)
		}
	}
	app.quit()
})
