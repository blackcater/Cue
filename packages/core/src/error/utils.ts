export function getMessageFromError(error?: unknown) {
	if (error instanceof Error) {
		return error.message
	}

	if (typeof error === 'string') {
		return error
	}

	return undefined
}
