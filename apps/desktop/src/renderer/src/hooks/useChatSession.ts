import { useCallback, useEffect } from 'react'

import { useAtom, useAtomValue, useSetAtom } from 'jotai'

import type { Session, SessionSummary, Turn } from '@/shared/types'

import {
	chatSessionIdsAtom,
	chatActiveSessionIdAtom,
	chatActiveSessionAtom,
	pendingPermissionAtom,
	isProcessingAtom,
	appendTurnAtom,
} from '@renderer/atoms'

/**
 * Chat API interface - matches the RPC paths exposed by chat handler
 * Methods map to RPC paths: /chat/session/<method>, /chat/<method>
 */
interface ChatApi {
	session: {
		create: (engineType: string, engineConfig?: Record<string, unknown>) => Promise<Session>
		list: (filter?: { engineType?: string; status?: string }) => Promise<SessionSummary[]>
		get: (id: string) => Promise<Session | null>
		delete: (id: string) => Promise<void>
		fork: (baseId: string, fromTurnId?: string) => Promise<Session>
		archive: (id: string) => Promise<void>
		rollback: (id: string, turnCount: number) => Promise<void>
	}
	send: (sessionId: string, input: string) => Promise<void>
	interrupt: (sessionId: string) => Promise<void>
	permission: {
		respond: (
			sessionId: string,
			requestId: string,
			approved: boolean,
			alwaysPattern?: string
		) => Promise<void>
	}
}

// Extend window.api with chat namespace
const chatApi = window.api as typeof window.api & { chat: ChatApi }

/**
 * Hook to manage chat sessions with RPC and event subscriptions
 */
export function useChatSession() {
	// Atoms
	const [sessionIds, setSessionIds] = useAtom(chatSessionIdsAtom)
	const [activeId, setActiveId] = useAtom(chatActiveSessionIdAtom)
	const activeSession = useAtomValue(chatActiveSessionAtom)
	const [isProcessing, setIsProcessing] = useAtom(isProcessingAtom)
	const [pendingPermission, setPendingPermission] = useAtom(pendingPermissionAtom)

	// Action atoms
	const appendTurn = useSetAtom(appendTurnAtom)

	// Load sessions on mount
	useEffect(() => {
		const loadSessions = async () => {
			try {
				const sessions = await chatApi.chat.session.list()
				setSessionIds(sessions.map((s) => s.id))
			} catch (error) {
				console.error('Failed to load sessions:', error)
			}
		}
		loadSessions()
	}, [setSessionIds])

	// Subscribe to RPC events
	useEffect(() => {
		const onDelta = (_sessionId: string, delta: unknown) => {
			// Delta contains text/reasoning/tool_use updates
			// The format depends on the engine implementation
			// Streaming content updates would be handled here
			console.debug('chat:delta', delta)
		}

		const onPermission = (_sessionId: string, permission: unknown) => {
			setPendingPermission(permission as Parameters<typeof setPendingPermission>[0])
			setIsProcessing(true)
		}

		const onTurnComplete = (sessionId: string, turn: unknown) => {
			appendTurn(sessionId, turn as Turn)
			setIsProcessing(false)
		}

		// Subscribe to events
		const cancelDelta = window.api.rpc.onEvent('chat/delta', onDelta)
		const cancelPermission = window.api.rpc.onEvent('chat/permission', onPermission)
		const cancelTurnComplete = window.api.rpc.onEvent('chat/turn_complete', onTurnComplete)

		return () => {
			cancelDelta()
			cancelPermission()
			cancelTurnComplete()
		}
	}, [appendTurn, setIsProcessing, setPendingPermission])

	// Actions
	const createSession = useCallback(
		async (engineType: string, engineConfig?: Record<string, unknown>) => {
			const session = await chatApi.chat.session.create(engineType, engineConfig)
			setSessionIds((prev) => [...prev, session.id])
			setActiveId(session.id)
			return session
		},
		[setSessionIds, setActiveId]
	)

	const switchSession = useCallback(
		(id: string) => {
			setActiveId(id)
		},
		[setActiveId]
	)

	const deleteSession = useCallback(
		async (id: string) => {
			await chatApi.chat.session.delete(id)
			setSessionIds((prev) => prev.filter((sid) => sid !== id))
			if (activeId === id) {
				setActiveId(null)
			}
		},
		[activeId, setActiveId, setSessionIds]
	)

	const sendMessage = useCallback(
		async (input: string) => {
			if (!activeId) {
				throw new Error('No active session')
			}
			setIsProcessing(true)
			try {
				await chatApi.chat.send(activeId, input)
			} catch (error) {
				setIsProcessing(false)
				throw error
			}
		},
		[activeId, setIsProcessing]
	)

	const interrupt = useCallback(async () => {
		if (!activeId) return
		await chatApi.chat.interrupt(activeId)
		setIsProcessing(false)
	}, [activeId, setIsProcessing])

	const respondPermission = useCallback(
		async (requestId: string, approved: boolean, alwaysPattern?: string) => {
			if (!activeId) return
			await chatApi.chat.permission.respond(activeId, requestId, approved, alwaysPattern)
			setPendingPermission(null)
		},
		[activeId, setPendingPermission]
	)

	// Additional session operations
	const forkSession = useCallback(
		async (baseId: string, fromTurnId?: string) => {
			const session = await chatApi.chat.session.fork(baseId, fromTurnId)
			setSessionIds((prev) => [...prev, session.id])
			setActiveId(session.id)
			return session
		},
		[setSessionIds, setActiveId]
	)

	const archiveSession = useCallback(
		async (id: string) => {
			await chatApi.chat.session.archive(id)
			setSessionIds((prev) => prev.filter((sid) => sid !== id))
			if (activeId === id) {
				setActiveId(null)
			}
		},
		[activeId, setActiveId, setSessionIds]
	)

	const rollbackSession = useCallback(
		async (id: string, turnCount: number) => {
			await chatApi.chat.session.rollback(id, turnCount)
		},
		[]
	)

	return {
		// State
		sessionIds,
		activeId,
		activeSession,
		isProcessing,
		pendingPermission,

		// Actions
		createSession,
		switchSession,
		deleteSession,
		sendMessage,
		interrupt,
		respondPermission,
		forkSession,
		archiveSession,
		rollbackSession,
	}
}
