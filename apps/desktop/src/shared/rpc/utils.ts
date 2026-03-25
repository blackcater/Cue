let counter = 0

export function generateId(): string {
	counter++
	return `rpc_${Date.now()}_${counter}_${Math.random().toString(36).slice(2)}`
}

export function extractRpcErrorMsg(error: unknown, defMsg?: string): string {
	if (error instanceof Error) {
		return error.message
	}

	if (error && (error as any).toJSON) {
		return (error as any).toJSON().message
	}

	return defMsg || 'An unknown error occurred'
}
