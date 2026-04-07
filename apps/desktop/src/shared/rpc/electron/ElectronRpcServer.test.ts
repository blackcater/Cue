import { describe, it, expect, vi } from 'bun:test'

import type { IpcMain } from 'electron'

import type { IWindowRegistry } from '../types'
import { ElectronRpcServer } from './ElectronRpcServer'

const createMockRegistry = (): IWindowRegistry => ({
	registerWindow: vi.fn(),
	unregisterWindow: vi.fn(),
	joinGroup: vi.fn(),
	leaveGroup: vi.fn(),
	sendToClient: vi.fn(),
	sendToGroup: vi.fn(),
	sendToAll: vi.fn(),
	getWebContentsByClientId: vi.fn(),
	getClientIdByWebContents: vi.fn(),
	getGroupsByClientId: vi.fn(),
})

const createMockIpcMain = (): IpcMain =>
	({
		on: vi.fn(),
		handle: vi.fn(),
	}) as unknown as IpcMain

describe('ElectronRpcServer', () => {
	it('should register handler with ipcMain.on', async () => {
		const mockRegistry = createMockRegistry()
		const mockIpcMain = createMockIpcMain()

		const server = new ElectronRpcServer(mockRegistry, mockIpcMain)

		server.handle('test/echo', async (msg) => {
			return { echoed: msg }
		})

		// Should listen on rpc:invoke:test/echo
		expect(mockIpcMain.on).toHaveBeenCalledWith(
			'rpc:invoke:test/echo',
			expect.any(Function)
		)
	})

	it('should support router for namespace organization', async () => {
		const mockRegistry = createMockRegistry()
		const mockIpcMain = createMockIpcMain()

		const server = new ElectronRpcServer(mockRegistry, mockIpcMain)

		server.router('conversation').handle('create', async (params) => {
			return { id: 'conv-1', ...(params as object) }
		})

		expect(mockIpcMain.on).toHaveBeenCalledWith(
			'rpc:invoke:conversation/create',
			expect.any(Function)
		)
	})

	it('should normalize event paths', async () => {
		const mockRegistry = createMockRegistry()
		const mockIpcMain = createMockIpcMain()

		const server = new ElectronRpcServer(mockRegistry, mockIpcMain)

		// Test with leading/trailing slashes
		server.handle('/test/path/', async () => 'ok')

		expect(mockIpcMain.on).toHaveBeenCalledWith(
			'rpc:invoke:test/path',
			expect.any(Function)
		)
	})

	it('should push event to broadcast', async () => {
		const mockRegistry = createMockRegistry()
		const mockIpcMain = createMockIpcMain()

		const server = new ElectronRpcServer(mockRegistry, mockIpcMain)

		server.push('test/event', { type: 'broadcast' }, { data: 'test' })

		expect(mockRegistry.sendToAll).toHaveBeenCalledWith(
			'rpc:event:test/event',
			{ data: 'test' }
		)
	})

	it('should push event to specific client', async () => {
		const mockRegistry = createMockRegistry()
		const mockIpcMain = createMockIpcMain()

		const server = new ElectronRpcServer(mockRegistry, mockIpcMain)

		server.push(
			'test/event',
			{ type: 'client', clientId: 'client-123' },
			{ data: 'test' }
		)

		expect(mockRegistry.sendToClient).toHaveBeenCalledWith(
			'client-123',
			'rpc:event:test/event',
			{ data: 'test' }
		)
	})

	it('should push event to group', async () => {
		const mockRegistry = createMockRegistry()
		const mockIpcMain = createMockIpcMain()

		const server = new ElectronRpcServer(mockRegistry, mockIpcMain)

		server.push(
			'test/event',
			{ type: 'group', groupId: 'group-456' },
			{ data: 'test' }
		)

		expect(mockRegistry.sendToGroup).toHaveBeenCalledWith(
			'group-456',
			'rpc:event:test/event',
			{ data: 'test' }
		)
	})
})
