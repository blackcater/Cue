import { createFileRoute } from '@tanstack/react-router'

import { ChatPage } from '@renderer/features/chat/pages/ChatPage'

export const Route = createFileRoute('/vault/$vaultId/thread/$threadId')({
	component: ThreadPage,
})

function ThreadPage() {
	const { threadId } = Route.useParams()

	return <ChatPage threadId={threadId} />
}
