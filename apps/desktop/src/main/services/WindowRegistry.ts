import type { BrowserWindow, WebContents } from 'electron'

export class WindowRegistry {
	readonly #windows = new Map<string, BrowserWindow>()
	readonly #groups = new Map<string, Set<string>>()
	readonly #clientIdToGroups = new Map<string, Set<string>>()
	readonly #webContentsToClientId = new Map<WebContents, string>()

	registerWindow(window: BrowserWindow, group?: string): string {
		const clientId = `client-${window.id}`

		this.#windows.set(clientId, window)
		this.#webContentsToClientId.set(window.webContents, clientId)

		if (group) {
			this.joinGroup(clientId, group)
			// Also track directly on #clientIdToGroups
			if (!this.#clientIdToGroups.has(clientId)) {
				this.#clientIdToGroups.set(clientId, new Set())
			}
			this.#clientIdToGroups.get(clientId)!.add(group)
		}

		return clientId
	}

	unregisterWindow(window: BrowserWindow): void {
		const clientId = this.#webContentsToClientId.get(window.webContents)
		if (!clientId) return

		for (const [, clientIds] of this.#groups) {
			clientIds.delete(clientId)
		}

		this.#clientIdToGroups.delete(clientId)

		this.#windows.delete(clientId)
		this.#webContentsToClientId.delete(window.webContents)
	}

	joinGroup(clientId: string, groupId: string): void {
		if (!this.#groups.has(groupId)) {
			this.#groups.set(groupId, new Set())
		}
		this.#groups.get(groupId)!.add(clientId)

		// Track per-client group membership
		if (!this.#clientIdToGroups.has(clientId)) {
			this.#clientIdToGroups.set(clientId, new Set())
		}
		this.#clientIdToGroups.get(clientId)!.add(groupId)
	}

	leaveGroup(clientId: string, groupId: string): void {
		this.#groups.get(groupId)?.delete(clientId)
	}

	sendToClient(clientId: string, channel: string, ...args: unknown[]): void {
		const window = this.#windows.get(clientId)
		if (window && !window.isDestroyed()) {
			// Original channel (for ElectronRpcClient via webContents)
			window.webContents.send(channel, ...args)
			// Generic channel (for IpcRendererRpcClient via ipcRenderer)
			// Extract eventName from channel like "rpc:event:eventName"
			if (channel.startsWith('rpc:event:')) {
				window.webContents.send('rpc:event', {
					channel,
					data: args,
				})
			}
		}
	}

	sendToGroup(groupId: string, channel: string, ...args: unknown[]): void {
		const clientIds = this.#groups.get(groupId)
		if (clientIds) {
			for (const clientId of clientIds) {
				this.sendToClient(clientId, channel, ...args)
			}
		}
	}

	sendToAll(channel: string, ...args: unknown[]): void {
		for (const [clientId] of this.#windows) {
			this.sendToClient(clientId, channel, ...args)
		}
	}

	getWebContentsByClientId(clientId: string): WebContents | null {
		const window = this.#windows.get(clientId)
		return window && !window.isDestroyed() ? window.webContents : null
	}

	getClientIdByWebContents(webContents: WebContents): string | null {
		return this.#webContentsToClientId.get(webContents) ?? null
	}

	getGroupsByClientId(clientId: string): string[] {
		return Array.from(this.#clientIdToGroups.get(clientId) ?? [])
	}
}
