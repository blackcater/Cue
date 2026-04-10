import { describe, it, expect, vi, beforeEach } from 'bun:test'

import { RpcError } from '../RpcError'
import { IpcRendererRpcClient } from './IpcRendererRpcClient'

describe('IpcRendererRpcClient', () => {
	let mockIpcRenderer: any

	beforeEach(() => {
		mockIpcRenderer = {
			send: vi.fn(),
			on: vi.fn((_channel: string, _cb: Function) => {}),
			removeListener: vi.fn(),
		}
	})

	const getResponseListener = () => {
		const responseCall = mockIpcRenderer.on.mock.calls.find(
			(call: any[]) => call[0] === 'rpc:response'
		)
		return responseCall?.[1]
	}

	it('should reject with RpcError containing code message and data', async () => {
		const client = new IpcRendererRpcClient(mockIpcRenderer)
		const resultPromise = client.call('/test', {})

		const responseListener = getResponseListener()
		expect(responseListener).toBeDefined()

		responseListener(null, {
			channel: 'rpc:response:invoke-1',
			error: {
				code: RpcError.NOT_FOUND,
				message: 'File not found',
				data: { filePath: '/missing.txt' },
			},
		})

		await expect(resultPromise).rejects.toMatchObject({
			code: RpcError.NOT_FOUND,
			message: 'File not found',
			data: { filePath: '/missing.txt' },
		})
	})

	it('should handle INTERNAL_ERROR code', async () => {
		const client = new IpcRendererRpcClient(mockIpcRenderer)
		const responseListener = getResponseListener()

		const resultPromise = client.call('/test', {})
		responseListener(null, {
			channel: 'rpc:response:invoke-1',
			error: { code: RpcError.INTERNAL_ERROR, message: 'Internal error' },
		})

		await expect(resultPromise).rejects.toMatchObject({
			code: RpcError.INTERNAL_ERROR,
			message: 'Internal error',
		})
	})

	it('should handle NOT_FOUND code', async () => {
		const client = new IpcRendererRpcClient(mockIpcRenderer)
		const responseListener = getResponseListener()

		const resultPromise = client.call('/test', {})
		responseListener(null, {
			channel: 'rpc:response:invoke-1',
			error: { code: RpcError.NOT_FOUND, message: 'Not found' },
		})

		await expect(resultPromise).rejects.toMatchObject({
			code: RpcError.NOT_FOUND,
			message: 'Not found',
		})
	})

	it('should handle error with no data field', async () => {
		const client = new IpcRendererRpcClient(mockIpcRenderer)
		const resultPromise = client.call('/test', {})

		const responseListener = getResponseListener()
		responseListener(null, {
			channel: 'rpc:response:invoke-1',
			error: { code: 'ERR_CODE', message: 'Simple error' },
		})

		await expect(resultPromise).rejects.toMatchObject({
			code: 'ERR_CODE',
			message: 'Simple error',
			data: undefined,
		})
	})
})
