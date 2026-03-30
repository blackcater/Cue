import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/vault/$vaultId/thread/$threadId')({
	component: ThreadPage,
})

function ThreadPage() {
	const { threadId } = Route.useParams()
	return <div>Thread View: {threadId}</div>
}
