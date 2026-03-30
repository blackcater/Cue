import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/chat-popup/$threadId/')({
	component: ChatPopupPage,
})

function ChatPopupPage() {
	const { threadId } = Route.useParams()

	return <div>Popup Thread View: {threadId}</div>
}
