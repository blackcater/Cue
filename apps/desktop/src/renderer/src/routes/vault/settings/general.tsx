import { createFileRoute } from '@tanstack/react-router'

import { GeneralPage } from '@renderer/pages/settings/GeneralPage'

export const Route = createFileRoute('/vault/settings/general')({
	component: GeneralPage,
})
