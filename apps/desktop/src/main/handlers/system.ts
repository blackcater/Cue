import type { RpcServer } from '@/shared/rpc'

export async function registerSystemHandlers(server: RpcServer) {
	const router = server.router('system')

	// TODO: Some system handlers
}
