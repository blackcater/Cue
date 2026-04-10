import { useChatSession } from '@renderer/hooks/useChatSession'
import { SessionItem } from './SessionItem'
import { NewSessionButton } from './NewSessionButton'

/**
 * Session list container for the chat sidebar
 */
export function SessionList() {
	const { sessionIds, activeId, switchSession, deleteSession } = useChatSession()

	return (
		<div className="flex flex-col gap-2 p-2">
			<NewSessionButton />

			{sessionIds.length === 0 ? (
				<p className="px-3 py-4 text-center text-sm text-muted-foreground">
					No sessions yet
				</p>
			) : (
				<div className="flex flex-col gap-1">
					{sessionIds.map((sessionId) => (
						<SessionItem
							key={sessionId}
							sessionId={sessionId}
							isActive={sessionId === activeId}
							onClick={() => switchSession(sessionId)}
							onDelete={() => deleteSession(sessionId)}
						/>
					))}
				</div>
			)}
		</div>
	)
}
