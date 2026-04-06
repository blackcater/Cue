import { createFileRoute } from '@tanstack/react-router'

import { AboutPage } from './-AboutPage'

export const Route = createFileRoute('/vault/$vaultId/settings/about')({
	component: AboutPage,
})
