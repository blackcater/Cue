import { createFileRoute } from '@tanstack/react-router'

import { AboutPage } from '@renderer/pages/settings/AboutPage'

export const Route = createFileRoute('/vault/settings/about')({
	component: AboutPage,
})
