/**
 * Creates an AbortSignal that aborts after the specified timeout.
 * Note: This is a polyfill for AbortSignal.timeout() which is not widely supported.
 */
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
	const controller = new AbortController()
	setTimeout(() => controller.abort(), timeoutMs)
	return controller.signal
}

/**
 * Creates an AbortSignal that can be aborted both manually and after timeout.
 */
export function createAbortSignalWithTimeout(timeoutMs: number): {
	signal: AbortSignal
	abort: () => void
} {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

	return {
		signal: controller.signal,
		abort: () => {
			clearTimeout(timeoutId)
			controller.abort()
		},
	}
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
