import { createFileRoute } from '@tanstack/react-router'

import { ChatPage } from '@renderer/pages/chat/ChatPage'

export const Route = createFileRoute('/vault/$vaultId/')({
	component: NewThreadPage,
})

function NewThreadPage() {
	return <ChatPage />
}
