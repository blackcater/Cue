import { describe, it, expect, vi, beforeEach } from 'bun:test'

import type { IpcMain, WebContents } from 'electron'

import type { IWindowRegistry } from '../types'
import { RpcError } from '../RpcError'
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

const createMockWebContents = (): WebContents =>
	({
		send: vi.fn(),
		id: 42,
		on: vi.fn(),
	}) as unknown as WebContents

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

	describe('error handling', () => {
		it('should register IPC handler for error throwing methods', () => {
			const mockRegistry = createMockRegistry()
			mockRegistry.getClientIdByWebContents = vi.fn().mockReturnValue('client-42')
			const mockIpcMain = createMockIpcMain()

			const server = new ElectronRpcServer(mockRegistry, mockIpcMain)
			server.handle('test/error', async () => {
				throw new Error('Something went wrong')
			})

			// Verify IPC listener was registered
			expect(mockIpcMain.on).toHaveBeenCalledWith(
				'rpc:invoke:test/error',
				expect.any(Function)
			)
		})

		it('should send unauthorized error when clientId is unknown', async () => {
			const mockRegistry = createMockRegistry()
			mockRegistry.getClientIdByWebContents = vi.fn().mockReturnValue(null)
			const mockIpcMain = createMockIpcMain()
			const mockWebContents = createMockWebContents()

			const pendingResponses: any[] = []
			;(mockWebContents.send as any).mockImplementation(
				(channel: string, ...args: any[]) => {
					pendingResponses.push({ channel, args })
				}
			)

			const server = new ElectronRpcServer(mockRegistry, mockIpcMain)
			server.handle('test/auth', async () => 'ok')

			// Get the registered IPC handler from mock.calls
			const ipcCall = (mockIpcMain.on as any).mock.calls.find(
				(call: any[]) => call[0] === 'rpc:invoke:test/auth'
			)
			expect(ipcCall).toBeDefined()
			const ipcHandler = ipcCall[1]

			const mockEvent = { sender: mockWebContents }
			await ipcHandler(mockEvent, { invokeId: 'invoke-5', args: [] })

			// Should send error to both channels
			expect(pendingResponses).toHaveLength(2)
			expect(pendingResponses[0].args[0]).toMatchObject({
				error: {
					code: RpcError.UNAUTHORIZED,
					message: 'Unknown client',
				},
			})
		})
	})
})
