import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/vault/$vaultId/')({
	component: HomePage,
})

function HomePage() {
	return <div>Thread List</div>
}
