import type { BrowserWindow, WebContents } from 'electron'

import type { WindowRegistry } from '../types'

export class AppWindowRegistry implements WindowRegistry {
	private windows = new Map<string, BrowserWindow>()
	private groups = new Map<string, Set<string>>()
	private webContentsToClientId = new Map<WebContents, string>()

	registerWindow(window: BrowserWindow, group?: string): string {
		const clientId = `client-${window.id}`
		this.windows.set(clientId, window)
		this.webContentsToClientId.set(window.webContents, clientId)

		if (group) {
			this.joinGroup(clientId, group)
		}

		return clientId
	}

	unregisterWindow(window: BrowserWindow): void {
		const clientId = this.webContentsToClientId.get(window.webContents)
		if (!clientId) return

		for (const [, clientIds] of this.groups) {
			clientIds.delete(clientId)
		}

		this.windows.delete(clientId)
		this.webContentsToClientId.delete(window.webContents)
	}

	joinGroup(clientId: string, groupId: string): void {
		if (!this.groups.has(groupId)) {
			this.groups.set(groupId, new Set())
		}
		this.groups.get(groupId)!.add(clientId)
	}

	leaveGroup(clientId: string, groupId: string): void {
		this.groups.get(groupId)?.delete(clientId)
	}

	sendToClient(clientId: string, channel: string, ...args: unknown[]): void {
		const window = this.windows.get(clientId)
		if (window && !window.isDestroyed()) {
			window.webContents.send(channel, ...args)
		}
	}

	sendToGroup(groupId: string, channel: string, ...args: unknown[]): void {
		const clientIds = this.groups.get(groupId)
		if (clientIds) {
			for (const clientId of clientIds) {
				this.sendToClient(clientId, channel, ...args)
			}
		}
	}

	sendToAll(channel: string, ...args: unknown[]): void {
		for (const [clientId] of this.windows) {
			this.sendToClient(clientId, channel, ...args)
		}
	}

	getWebContentsByClientId(clientId: string): WebContents | null {
		const window = this.windows.get(clientId)
		return window && !window.isDestroyed() ? window.webContents : null
	}

	getClientIdByWebContents(webContents: WebContents): string | null {
		return this.webContentsToClientId.get(webContents) ?? null
	}
}
