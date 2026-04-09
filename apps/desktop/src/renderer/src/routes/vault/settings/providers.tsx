import { createFileRoute } from '@tanstack/react-router'

import { ProvidersPage } from '@renderer/pages/settings/ProvidersPage'

export const Route = createFileRoute('/vault/settings/providers')({
	component: ProvidersPage,
})
