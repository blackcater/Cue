import { useAtomValue } from 'jotai'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete01Icon } from '@hugeicons/core-free-icons'
import { chatSessionAtomFamily } from '@renderer/atoms'
import type { Session, Turn, Part } from '@/shared/types'

interface SessionItemProps {
	sessionId: string
	isActive: boolean
	onClick: () => void
	onDelete: () => void
}

/**
 * Extended Session type with turns - matches runtime behavior
 */
interface SessionWithTurns extends Session {
	turns: Turn[]
	title?: string
}

/**
 * Get preview text from the first user message in a session
 */
function getPreviewFromSession(session: Session | null): string | null {
	const extSession = session as SessionWithTurns | null
	if (!extSession?.turns?.length) return null

	for (const turn of extSession.turns) {
		for (const message of turn.messages) {
			if (message.role === 'user') {
				// Find the first text part
				const textPart = message.parts.find((p: Part) => p.type === 'text')
				if (textPart && 'text' in textPart) {
					return textPart.text.slice(0, 100)
				}
			}
		}
	}
	return null
}

/**
 * Get session title or "Untitled" if no title exists
 */
function getSessionTitle(session: Session | null): string {
	const extSession = session as SessionWithTurns | null
	if (extSession?.title) {
		return extSession.title
	}
	return 'Untitled'
}

export function SessionItem({ sessionId, isActive, onClick, onDelete }: SessionItemProps) {
	const session = useAtomValue(chatSessionAtomFamily(sessionId))
	const title = getSessionTitle(session)
	const preview = getPreviewFromSession(session)

	return (
		<div
			className={`group relative flex cursor-pointer flex-col gap-1 rounded-md px-3 py-2 transition-colors ${
				isActive
					? 'bg-accent text-accent-foreground'
					: 'hover:bg-muted/50'
			}`}
			onClick={onClick}
			onKeyDown={(e) => e.key === 'Enter' && onClick()}
			role="button"
			tabIndex={0}
		>
			<div className="flex items-center justify-between">
				<span className="truncate font-medium text-sm">{title}</span>
				<button
					onClick={(e) => {
						e.stopPropagation()
						onDelete()
					}}
					className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
					aria-label="Delete session"
				>
					<HugeiconsIcon icon={Delete01Icon} size={14} />
				</button>
			</div>
			{preview && <p className="truncate text-xs text-muted-foreground">{preview}</p>}
		</div>
	)
}
