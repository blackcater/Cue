import { describe, expect, it, vi, beforeEach } from 'bun:test'

// Mock functions
const mockSend = vi.fn()
const mockOn = vi.fn()
const mockRemoveListener = vi.fn()

const mockIpcRenderer = {
	send: mockSend,
	on: mockOn,
	off: mockRemoveListener,
}

import { ElectronRpcClient } from './ElectronRpcClient'

describe('ElectronRpcClient', () => {
	beforeEach(() => {
		mockSend.mockClear()
		mockOn.mockClear()
		mockRemoveListener.mockClear()
	})

	it('should create client with groupId', () => {
		const client = new ElectronRpcClient({
			groupId: 'test-group',
			ipcRenderer: mockIpcRenderer,
		})
		expect(client.groupId).toBe('test-group')
	})

	it('should send call and receive response', async () => {
		const client = new ElectronRpcClient({
			groupId: 'test-group',
			ipcRenderer: mockIpcRenderer,
		})

		// Capture the call ID
		let capturedId: string | undefined
		mockSend.mockImplementation(
			(channel: string, id: string, ..._args: unknown[]) => {
				if (channel === 'rpc:call') {
					capturedId = id
				}
			}
		)

		// Simulate server response
		const responseHandler = mockOn.mock.calls.find(
			([channel]) => channel === 'rpc:response'
		)?.[1]

		const replyPromise = client.call('testMethod', { foo: 'bar' })

		// Wait a tick for the call to be registered
		await new Promise((resolve) => setImmediate(resolve))

		// Simulate server sending response with the correct ID
		responseHandler(null, { id: capturedId, result: { ok: true } })

		const result = await replyPromise
		expect(result).toEqual({ ok: true })
	})

	it('should handle error responses', async () => {
		const client = new ElectronRpcClient({
			groupId: 'test-group',
			ipcRenderer: mockIpcRenderer,
		})

		// Capture the call ID
		let capturedId: string | undefined
		mockSend.mockImplementation(
			(channel: string, id: string, ..._args: unknown[]) => {
				if (channel === 'rpc:call') {
					capturedId = id
				}
			}
		)

		const responseHandler = mockOn.mock.calls.find(
			([channel]) => channel === 'rpc:response'
		)?.[1]

		const callPromise = client.call('errorMethod', {})

		// Wait a tick for the call to be registered
		await new Promise((resolve) => setImmediate(resolve))

		// Simulate server sending error with the correct ID
		responseHandler(null, {
			id: capturedId,
			error: { code: 'TEST_ERROR', message: 'Test error' },
		})

		await expect(callPromise).rejects.toThrow('Test error')
	})
})
