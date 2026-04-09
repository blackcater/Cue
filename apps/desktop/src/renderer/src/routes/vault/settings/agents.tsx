import { createFileRoute } from '@tanstack/react-router'

import { AgentsPage } from '@renderer/pages/settings/AgentsPage'

export const Route = createFileRoute('/vault/settings/agents')({
	component: AgentsPage,
})
