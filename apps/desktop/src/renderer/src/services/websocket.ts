/**
 * WebSocket service - provides reliable WebSocket connection with automatic reconnection
 */

export type WebSocketMessageHandler = (data: unknown) => void

// Reconnection configuration
const INITIAL_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 30000
const RECONNECT_DELAY_MULTIPLIER = 2

export interface WebSocketConnection {
	/** Connect to the WebSocket server */
	connect: () => void
	/** Send data to the server */
	send: (data: unknown) => void
	/** Disconnect from the server and stop reconnection attempts */
	disconnect: () => void
	/** Register a message handler */
	onMessage: (handler: WebSocketMessageHandler) => () => void
	/** Connection state */
	isConnected: () => boolean
}

export function createWebSocketConnection(params: {
	url: string
}): WebSocketConnection {
	let ws: WebSocket | null = null
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null
	let reconnectAttempt = 0
	let connected = false

	// Message handlers registry
	const messageHandlers = new Set<WebSocketMessageHandler>()

	/**
	 * Calculate delay for next reconnection attempt using exponential backoff
	 */
	const getReconnectDelay = () => {
		const delay = Math.min(
			INITIAL_RECONNECT_DELAY_MS *
				Math.pow(RECONNECT_DELAY_MULTIPLIER, reconnectAttempt),
			MAX_RECONNECT_DELAY_MS
		)
		return delay
	}

	/**
	 * Handle incoming WebSocket message
	 */
	const handleMessage = (data: unknown) => {
		messageHandlers.forEach((handler) => handler(data))
	}

	/**
	 * Schedule a reconnection attempt with exponential backoff
	 */
	const scheduleReconnect = () => {
		if (reconnectTimer) return

		connected = false
		const delay = getReconnectDelay()
		reconnectAttempt++

		reconnectTimer = setTimeout(() => {
			reconnectTimer = null
			connect()
		}, delay)
	}

	/**
	 * Reset reconnection state
	 */
	const resetReconnectionState = () => {
		reconnectAttempt = 0
		if (reconnectTimer) {
			clearTimeout(reconnectTimer)
			reconnectTimer = null
		}
	}

	/**
	 * Connect to the WebSocket server
	 */
	const connect = () => {
		// Clean up existing connection if any
		if (ws) {
			ws.onclose = null
			ws.onmessage = null
			ws.onerror = null
			if (
				ws.readyState === WebSocket.OPEN ||
				ws.readyState === WebSocket.CONNECTING
			) {
				ws.close()
			}
		}

		ws = new WebSocket(params.url)

		ws.onopen = () => {
			connected = true
			reconnectAttempt = 0
		}

		ws.onmessage = (e) => {
			try {
				handleMessage(JSON.parse(e.data))
			} catch {
				// If parsing fails, pass raw data
				handleMessage(e.data)
			}
		}

		ws.onclose = () => {
			connected = false
			scheduleReconnect()
		}

		ws.onerror = () => {
			// Error will trigger onclose, let it handle reconnection
		}
	}

	/**
	 * Send data to the WebSocket server
	 */
	const send = (data: unknown) => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(data))
		}
	}

	/**
	 * Disconnect and stop reconnection attempts
	 */
	const disconnect = () => {
		resetReconnectionState()
		connected = false

		if (ws) {
			ws.onclose = null
			ws.onmessage = null
			ws.onerror = null
			ws.close()
			ws = null
		}
	}

	/**
	 * Register a message handler, returns unsubscribe function
	 */
	const onMessage = (handler: WebSocketMessageHandler) => {
		messageHandlers.add(handler)
		return () => {
			messageHandlers.delete(handler)
		}
	}

	/**
	 * Check if currently connected
	 */
	const isConnected = () => connected

	return {
		connect,
		send,
		disconnect,
		onMessage,
		isConnected,
	}
}
