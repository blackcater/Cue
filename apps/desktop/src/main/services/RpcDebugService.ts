import { ElectronRpcServer } from '../../shared/rpc'
import type { Rpc } from '../../shared/rpc'

export class RpcDebugService {
	constructor(private readonly server: ElectronRpcServer) {
		this.registerHandlers()
	}

	private registerHandlers() {
		const router = this.server.router('debug')

		// Basic call - echo back the input
		router.handle('echo', ((_, text: string) => text) as Rpc.HandlerFn)

		// Basic call - add two numbers
		router.handle(
			'add',
			((_, a: number, b: number) => a + b) as Rpc.HandlerFn
		)

		// Stream - yield numbers 1 to 5
		router.handle('stream-numbers', async function* () {
			for (let i = 1; i <= 5; i++) {
				await new Promise((r) => setTimeout(r, 200))
				yield i
			}
		} as Rpc.HandlerFn)

		// Context - return server time and clientId
		router.handle('server-time', ((ctx) => ({
			clientId: ctx.clientId,
			time: new Date().toISOString(),
		})) as Rpc.HandlerFn)

		// Push - trigger an event to the calling client
		router.handle('trigger-event', ((ctx, eventName: string) => {
			this.server.push(
				eventName,
				{ type: 'client', clientId: ctx.clientId },
				'Hello from server!'
			)
			return { triggered: true }
		}) as Rpc.HandlerFn)

		// Slow echo - waits 3 seconds then returns
		router.handle('slow-echo', (async (_, text: string) => {
			// Wait 3 seconds
			await new Promise((resolve) => setTimeout(resolve, 3000))

			return { text, completed: true }
		}) as Rpc.HandlerFn)
	}
}
