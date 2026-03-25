import { describe, it, expect, vi } from 'vitest'
import type { WebContents } from 'electron'
import { ElectronRpcClient } from './ElectronRpcClient'

describe('ElectronRpcClient', () => {
    it('should have clientId based on webContents id', () => {
        const mockWebContents = {
            send: vi.fn(),
            id: 42,
            on: vi.fn(),
        }

        const client = new ElectronRpcClient(mockWebContents as unknown as WebContents)

        expect(client.clientId).toBe('client-42')
    })

    it('should accept custom groupId', () => {
        const mockWebContents = {
            send: vi.fn(),
            id: 1,
            on: vi.fn(),
        }

        const client = new ElectronRpcClient(mockWebContents as unknown as WebContents, 'my-group')

        expect(client.groupId).toBe('my-group')
    })

    it('should register listener for event', () => {
        const mockWebContents = {
            send: vi.fn(),
            id: 1,
            on: vi.fn(),
        }

        const client = new ElectronRpcClient(mockWebContents as unknown as WebContents)
        const listener = vi.fn()
        client.onEvent('notification', listener)

        expect(mockWebContents.on).toHaveBeenCalledWith(
            'rpc:event:notification',
            expect.any(Function)
        )
    })

    it('should return cancel function from onEvent', () => {
        const mockWebContents = {
            send: vi.fn(),
            id: 1,
            on: vi.fn(),
        }

        const client = new ElectronRpcClient(mockWebContents as unknown as WebContents)
        const listener = vi.fn()
        const cancel = client.onEvent('notification', listener)

        // Cancel should be a function
        expect(typeof cancel).toBe('function')
    })

    it('should abort pending calls', async () => {
        const mockWebContents = {
            send: vi.fn(),
            id: 1,
            on: vi.fn(),
        }

        const client = new ElectronRpcClient(mockWebContents as unknown as WebContents)

        // Manually add a pending call
        ;(client as any).pendingCalls.set('test-id', {
            resolve: vi.fn(),
            reject: vi.fn(),
        })

        client.abort()

        // Pending calls should be cleared
        expect((client as any).pendingCalls.size).toBe(0)
    })
})