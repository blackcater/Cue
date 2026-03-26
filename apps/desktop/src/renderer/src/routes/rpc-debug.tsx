import { useEffect, useState } from 'react'

import { RpcError } from '@/shared/rpc/RpcError'

interface RpcClient {
	readonly clientId: string
	readonly groupId?: string
	call<T>(event: string, ...args: unknown[]): Promise<T>
	stream<T>(
		event: string,
		...args: unknown[]
	): {
		[Symbol.asyncIterator](): AsyncIterator<T>
		cancel(): void
	}
	onEvent(event: string, listener: (...args: unknown[]) => void): () => void
}

function getRpcClient(): RpcClient {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const api = (window as any).api
	if (!api?.getRpcClient) {
		throw new Error('RPC client not available')
	}
	return api.getRpcClient()
}

function useDarkMode() {
	const [isDark, setIsDark] = useState(false)

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
		setIsDark(mediaQuery.matches)

		const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
		mediaQuery.addEventListener('change', handler)
		return () => mediaQuery.removeEventListener('change', handler)
	}, [])

	return isDark
}

function useThemeColors(isDark: boolean) {
	const styles: Record<string, React.CSSProperties> = {
		container: {
			padding: '24px',
			maxWidth: '1200px',
			margin: '0 auto',
		},
		pageTitle: {
			fontSize: '28px',
			fontWeight: 'bold',
			marginBottom: '8px',
			color: isDark ? '#fff' : '#000',
		},
		subtitle: {
			fontSize: '16px',
			color: isDark ? '#aaa' : '#666',
			marginBottom: '24px',
		},
		grid: {
			display: 'grid',
			gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
			gap: '16px',
		},
		card: {
			border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
			borderRadius: '8px',
			padding: '16px',
			backgroundColor: isDark ? '#1a1a1a' : '#fff',
		},
		cardTitle: {
			fontSize: '14px',
			fontWeight: 'bold',
			marginBottom: '12px',
			fontFamily: 'monospace',
			color: isDark ? '#fff' : '#000',
		},
		inputRow: {
			display: 'flex',
			gap: '12px',
			marginBottom: '12px',
		},
		inputGroup: {
			display: 'flex',
			flexDirection: 'column',
			gap: '4px',
			flex: 1,
		},
		label: {
			fontSize: '12px',
			color: isDark ? '#aaa' : '#666',
		},
		input: {
			padding: '8px',
			border: `1px solid ${isDark ? '#444' : '#ccc'}`,
			borderRadius: '4px',
			fontSize: '14px',
			backgroundColor: isDark ? '#222' : '#fff',
			color: isDark ? '#fff' : '#000',
		},
		buttonRow: {
			display: 'flex',
			gap: '8px',
			marginBottom: '12px',
		},
		button: {
			padding: '8px 16px',
			backgroundColor: '#007AFF',
			color: '#fff',
			border: 'none',
			borderRadius: '4px',
			cursor: 'pointer',
			fontSize: '14px',
		},
		cancelButton: {
			backgroundColor: '#FF3B30',
		},
		result: {
			marginTop: '12px',
			padding: '8px',
			backgroundColor: isDark ? '#222' : '#f5f5f5',
			borderRadius: '4px',
			fontSize: '12px',
			fontFamily: 'monospace',
			whiteSpace: 'pre-wrap',
			color: isDark ? '#fff' : '#000',
		},
		error: {
			marginTop: '12px',
			padding: '8px',
			backgroundColor: isDark ? '#3a1a1a' : '#fff0f0',
			borderRadius: '4px',
			fontSize: '12px',
			color: '#FF3B30',
			fontFamily: 'monospace',
		},
		progress: {
			marginTop: '12px',
			fontSize: '14px',
			fontFamily: 'monospace',
			color: isDark ? '#fff' : '#000',
		},
		chunk: {
			marginLeft: '4px',
			color: '#007AFF',
		},
		eventLog: {
			marginTop: '12px',
			padding: '8px',
			backgroundColor: isDark ? '#222' : '#f5f5f5',
			borderRadius: '4px',
			fontSize: '12px',
			fontFamily: 'monospace',
			maxHeight: '150px',
			overflowY: 'auto',
			color: isDark ? '#fff' : '#000',
		},
	}
	return styles
}

// Card component for basic RPC calls
function CallCard({
	title,
	onCall,
	styles,
}: {
	title: string
	onCall: () => Promise<{ result: unknown; time: string }>
	styles: ReturnType<typeof useThemeColors>
}) {
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<{
		result: unknown
		time: string
	} | null>(null)
	const [error, setError] = useState<string | null>(null)

	const handleCall = async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await onCall()
			setResult(res)
		} catch (err) {
			const rpcErr = err as RpcError
			setError(rpcErr.message || String(err))
			setResult(null)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={styles['card']}>
			<h3 style={styles['cardTitle']}>{title}</h3>
			<button
				style={styles['button']}
				onClick={handleCall}
				disabled={loading}
			>
				{loading ? 'Calling...' : 'Call'}
			</button>
			{result && (
				<div style={styles['result']}>
					<strong>Result:</strong> {JSON.stringify(result.result)}
					<br />
					<strong>Time:</strong> {result.time}
				</div>
			)}
			{error && <div style={styles['error']}>Error: {error}</div>}
		</div>
	)
}

// Card for RPC calls with input
function InputCallCard({
	title,
	inputFields,
	onCall,
	styles,
}: {
	title: string
	inputFields: { label: string; defaultValue: string }[]
	onCall: (values: string[]) => Promise<{ result: unknown; time: string }>
	styles: ReturnType<typeof useThemeColors>
}) {
	const [values, setValues] = useState<string[]>(
		inputFields.map((f) => f.defaultValue)
	)
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<{
		result: unknown
		time: string
	} | null>(null)
	const [error, setError] = useState<string | null>(null)

	const handleCall = async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await onCall(values)
			setResult(res)
		} catch (err) {
			const rpcErr = err as RpcError
			setError(rpcErr.message || String(err))
			setResult(null)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={styles['card']}>
			<h3 style={styles['cardTitle']}>{title}</h3>
			<div style={styles['inputRow']}>
				{inputFields.map((field, idx) => (
					<div key={field.label} style={styles['inputGroup']}>
						<label style={styles['label']}>{field.label}</label>
						<input
							type="text"
							style={styles['input']}
							value={values[idx]}
							onChange={(e) => {
								const newValues = [...values]
								newValues[idx] = e.target.value
								setValues(newValues)
							}}
						/>
					</div>
				))}
			</div>
			<button
				style={styles['button']}
				onClick={handleCall}
				disabled={loading}
			>
				{loading ? 'Calling...' : 'Call'}
			</button>
			{result && (
				<div style={styles['result']}>
					<strong>Result:</strong> {JSON.stringify(result.result)}
					<br />
					<strong>Time:</strong> {result.time}
				</div>
			)}
			{error && <div style={styles['error']}>Error: {error}</div>}
		</div>
	)
}

// Card for streaming RPC calls
function StreamCard({
	title,
	styles,
}: {
	title: string
	styles: ReturnType<typeof useThemeColors>
}) {
	const [loading, setLoading] = useState(false)
	const [streaming, setStreaming] = useState(false)
	const [chunks, setChunks] = useState<number[]>([])
	const [result, setResult] = useState<{
		result: number[]
		time: string
	} | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [currentStream, setCurrentStream] = useState<{
		cancel: () => void
	} | null>(null)

	const handleStart = async () => {
		setLoading(true)
		setStreaming(true)
		setChunks([])
		setError(null)
		setResult(null)

		try {
			const streamCtrl = { cancel: () => {} }
			setCurrentStream(streamCtrl)

			const client = getRpcClient()
			const streamResult = client.stream<number>('/debug/stream-numbers')

			streamCtrl.cancel = () => {
				streamResult.cancel()
			}

			const collected: number[] = []
			for await (const chunk of streamResult) {
				collected.push(chunk)
				setChunks([...collected])
			}

			setResult({
				result: collected,
				time: new Date().toLocaleTimeString(),
			})
		} catch (err) {
			const rpcErr = err as RpcError
			setError(rpcErr.message || String(err))
		} finally {
			setLoading(false)
			setStreaming(false)
			setCurrentStream(null)
		}
	}

	const handleCancel = () => {
		if (currentStream) {
			currentStream.cancel()
		}
		setStreaming(false)
		setLoading(false)
	}

	return (
		<div style={styles['card']}>
			<h3 style={styles['cardTitle']}>{title}</h3>
			<div style={styles['buttonRow']}>
				<button
					style={styles['button']}
					onClick={handleStart}
					disabled={loading || streaming}
				>
					{loading ? 'Starting...' : 'Start Stream'}
				</button>
				{streaming && (
					<button
						style={{
							...styles['button'],
							...styles['cancelButton'],
						}}
						onClick={handleCancel}
					>
						Cancel
					</button>
				)}
			</div>
			{streaming && (
				<div style={styles['progress']}>
					<strong>Progress:</strong>
					{chunks.map((c, i) => (
						<span key={i} style={styles['chunk']}>
							[{c}]
						</span>
					))}
				</div>
			)}
			{result && (
				<div style={styles['result']}>
					<strong>Final Result:</strong>{' '}
					{JSON.stringify(result.result)}
					<br />
					<strong>Time:</strong> {result.time}
				</div>
			)}
			{error && <div style={styles['error']}>Error: {error}</div>}
		</div>
	)
}

// Card for slow echo test
function SlowEchoCard({
	styles,
}: {
	styles: ReturnType<typeof useThemeColors>
}) {
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<{
		result: unknown
		time: string
	} | null>(null)
	const [error, setError] = useState<string | null>(null)

	const handleCall = async () => {
		setLoading(true)
		setError(null)
		setResult(null)

		try {
			const client = getRpcClient()
			const start = Date.now()

			const result_ = await client.call<{
				text: string
				completed: boolean
			}>('/debug/slow-echo', 'hello')

			setResult({
				result: result_,
				time: `${Date.now() - start}ms`,
			})
		} catch (err) {
			const rpcErr = err as RpcError
			setError(rpcErr.message || String(err))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={styles['card']}>
			<h3 style={styles['cardTitle']}>/debug/slow-echo</h3>
			<button
				style={styles['button']}
				onClick={handleCall}
				disabled={loading}
			>
				{loading ? 'Waiting...' : 'Call'}
			</button>
			{result && (
				<div style={styles['result']}>
					<strong>Result:</strong> {JSON.stringify(result.result)}
					<br />
					<strong>Time:</strong> {result.time}
				</div>
			)}
			{error && <div style={styles['error']}>Error: {error}</div>}
		</div>
	)
}

// Card for window info
function WindowInfoCard({
	styles,
}: {
	styles: ReturnType<typeof useThemeColors>
}) {
	const [info, setInfo] = useState<{
		clientId: string
		groupId: string | null
	} | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleFetch = async () => {
		setLoading(true)
		setError(null)
		try {
			const client = getRpcClient()
			const result = await client.call<{
				clientId: string
				groupId: string | null
			}>('/debug/window/info')
			setInfo(result)
		} catch (err) {
			setError((err as Error).message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={styles['card']}>
			<h3 style={styles['cardTitle']}>Window Info</h3>
			<button
				style={styles['button']}
				onClick={handleFetch}
				disabled={loading}
			>
				{loading ? 'Fetching...' : 'Refresh'}
			</button>
			{info && (
				<div style={styles['result']}>
					<strong>clientId:</strong> {info.clientId}
					<br />
					<strong>groupId:</strong> {info.groupId ?? '(none)'}
				</div>
			)}
			{error && <div style={styles['error']}>Error: {error}</div>}
		</div>
	)
}

// Card for window manager
function WindowManagerCard({
	styles,
}: {
	styles: ReturnType<typeof useThemeColors>
}) {
	const [groupId, setGroupId] = useState<string>('none')
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<{
		clientId: string
		windowId: number
	} | null>(null)
	const [error, setError] = useState<string | null>(null)

	const handleCreate = async () => {
		setLoading(true)
		setError(null)
		setResult(null)
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const group = groupId === 'none' ? null : groupId
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const res = await (window as any).api.createWindow(group)
			setResult(res)
		} catch (err) {
			setError((err as Error).message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={styles['card']}>
			<h3 style={styles['cardTitle']}>Window Manager</h3>
			<div style={styles['inputGroup']}>
				<label style={styles['label']}>Group</label>
				<select
					style={styles['input']}
					value={groupId}
					onChange={(e) => setGroupId(e.target.value)}
				>
					<option value="none">No Group</option>
					<option value="group-a">Group A</option>
					<option value="group-b">Group B</option>
				</select>
			</div>
			<button
				style={styles['button']}
				onClick={handleCreate}
				disabled={loading}
			>
				{loading ? 'Creating...' : 'Spawn Window'}
			</button>
			{result && (
				<div style={styles['result']}>
					<strong>clientId:</strong> {result.clientId}
					<br />
					<strong>windowId:</strong> {result.windowId}
				</div>
			)}
			{error && <div style={styles['error']}>Error: {error}</div>}
		</div>
	)
}

// Card for broadcast
function BroadcastCard({
	styles,
}: {
	styles: ReturnType<typeof useThemeColors>
}) {
	const [eventName, setEventName] = useState('broadcast-event')
	const [targetGroup, setTargetGroup] = useState('group-a')
	const [targetClientId, setTargetClientId] = useState('')
	const [message, setMessage] = useState('Hello from broadcast!')
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<unknown>(null)
	const [error, setError] = useState<string | null>(null)

	const client = getRpcClient()

	const handleSendToAll = async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await client.call(
				'/debug/push/send-to-all',
				eventName,
				message
			)
			setResult(res)
		} catch (err) {
			setError((err as Error).message)
		} finally {
			setLoading(false)
		}
	}

	const handleSendToGroup = async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await client.call(
				'/debug/push/send-to-group',
				targetGroup,
				eventName,
				message
			)
			setResult(res)
		} catch (err) {
			setError((err as Error).message)
		} finally {
			setLoading(false)
		}
	}

	const handleSendToClient = async () => {
		if (!targetClientId.trim()) {
			setError('clientId is required')
			return
		}
		setLoading(true)
		setError(null)
		try {
			const res = await client.call(
				'/debug/push/send-to-client',
				targetClientId,
				eventName,
				message
			)
			setResult(res)
		} catch (err) {
			setError((err as Error).message)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div style={styles['card']}>
			<h3 style={styles['cardTitle']}>Broadcast</h3>
			<div style={styles['inputGroup']}>
				<label style={styles['label']}>Event Name</label>
				<input
					type="text"
					style={styles['input']}
					value={eventName}
					onChange={(e) => setEventName(e.target.value)}
				/>
			</div>
			<div style={styles['inputGroup']}>
				<label style={styles['label']}>Message</label>
				<input
					type="text"
					style={styles['input']}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
				/>
			</div>

			<div style={styles['buttonRow']}>
				<button
					style={styles['button']}
					onClick={handleSendToAll}
					disabled={loading}
				>
					Send to All
				</button>
				<button
					style={styles['button']}
					onClick={handleSendToGroup}
					disabled={loading}
				>
					Send to Group
				</button>
				<button
					style={styles['button']}
					onClick={handleSendToClient}
					disabled={loading}
				>
					Send to Client
				</button>
			</div>

			<div style={styles['inputRow']}>
				<div style={styles['inputGroup']}>
					<label style={styles['label']}>Target Group</label>
					<select
						style={styles['input']}
						value={targetGroup}
						onChange={(e) => setTargetGroup(e.target.value)}
					>
						<option value="group-a">Group A</option>
						<option value="group-b">Group B</option>
					</select>
				</div>
				<div style={styles['inputGroup']}>
					<label style={styles['label']}>Target ClientId</label>
					<input
						type="text"
						style={styles['input']}
						value={targetClientId}
						onChange={(e) => setTargetClientId(e.target.value)}
						placeholder="client-123"
					/>
				</div>
			</div>

			{result !== null && (
				<div style={styles['result']}>{JSON.stringify(result)}</div>
			)}
			{error && <div style={styles['error']}>Error: {error}</div>}
		</div>
	)
}

// Card for event listener
function EventListenerCard({
	styles,
}: {
	styles: ReturnType<typeof useThemeColors>
}) {
	const [listening, setListening] = useState(false)
	const [events, setEvents] = useState<{ name: string; data: unknown }[]>([])
	const [eventName, setEventName] = useState('my-event')
	const [cancelFn, setCancelFn] = useState<(() => void) | null>(null)

	const handleStart = () => {
		try {
			const client = getRpcClient()
			const cancel = client.onEvent(eventName, (...args) => {
				setEvents((prev) => [...prev, { name: eventName, data: args }])
			})
			setCancelFn(() => cancel)
			setListening(true)
		} catch (err) {
			console.error('Failed to start listening:', err)
		}
	}

	const handleStop = () => {
		if (cancelFn) {
			cancelFn()
			setCancelFn(null)
		}
		setListening(false)
	}

	const handleClear = () => {
		setEvents([])
	}

	return (
		<div style={styles['card']}>
			<h3 style={styles['cardTitle']}>Event Listener</h3>
			<div style={styles['inputGroup']}>
				<label style={styles['label']}>Event Name</label>
				<input
					type="text"
					style={styles['input']}
					value={eventName}
					onChange={(e) => setEventName(e.target.value)}
				/>
			</div>
			<div style={styles['buttonRow']}>
				{!listening ? (
					<button style={styles['button']} onClick={handleStart}>
						Start Listening
					</button>
				) : (
					<button
						style={{
							...styles['button'],
							...styles['cancelButton'],
						}}
						onClick={handleStop}
					>
						Stop Listening
					</button>
				)}
				<button style={styles['button']} onClick={handleClear}>
					Clear
				</button>
			</div>
			{events.length > 0 && (
				<div style={styles['eventLog']}>
					<strong>Events:</strong>
					{events.map((e, i) => (
						<div key={i}>
							- &quot;{e.name}&quot;: sender=
							{String((e.data as unknown[])[0])}, eventName=
							{String((e.data as unknown[])[1])}, payload=
							{JSON.stringify((e.data as unknown[])[2])}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export function RpcDebugPage() {
	const isDark = useDarkMode()
	const styles = useThemeColors(isDark)

	return (
		<div style={styles['container']}>
			<h1 style={styles['pageTitle']}>RPC Debug Examples</h1>
			<p style={styles['subtitle']}>Test custom RPC capabilities</p>

			<div style={styles['grid']}>
				<WindowInfoCard styles={styles} />
				<WindowManagerCard styles={styles} />
				<BroadcastCard styles={styles} />
				<InputCallCard
					title="/debug/echo"
					inputFields={[{ label: 'text', defaultValue: 'hello' }]}
					onCall={async ([text]) => {
						const client = getRpcClient()
						const start = Date.now()
						const result = await client.call<string>(
							'/debug/echo',
							text
						)
						return { result, time: `${Date.now() - start}ms` }
					}}
					styles={styles}
				/>

				<InputCallCard
					title="/debug/add"
					inputFields={[
						{ label: 'a', defaultValue: '21' },
						{ label: 'b', defaultValue: '21' },
					]}
					onCall={async ([a, b]) => {
						const client = getRpcClient()
						const start = Date.now()
						const result = await client.call<number>(
							'/debug/add',
							Number(a),
							Number(b)
						)
						return { result, time: `${Date.now() - start}ms` }
					}}
					styles={styles}
				/>

				<StreamCard title="/debug/stream-numbers" styles={styles} />

				<CallCard
					title="/debug/server-time"
					onCall={async () => {
						const client = getRpcClient()
						const start = Date.now()
						const result = await client.call<{
							clientId: string
							time: string
						}>('/debug/server-time')
						return { result, time: `${Date.now() - start}ms` }
					}}
					styles={styles}
				/>

				<SlowEchoCard styles={styles} />

				<InputCallCard
					title="/debug/trigger-event"
					inputFields={[
						{ label: 'event name', defaultValue: 'my-event' },
					]}
					onCall={async ([name]) => {
						const client = getRpcClient()
						const start = Date.now()
						const result = await client.call<{
							triggered: boolean
						}>('/debug/trigger-event', name)
						return { result, time: `${Date.now() - start}ms` }
					}}
					styles={styles}
				/>

				<EventListenerCard styles={styles} />
			</div>
		</div>
	)
}
