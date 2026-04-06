import { createFileRoute } from '@tanstack/react-router'

import { GeneralPage } from './-GeneralPage'

export const Route = createFileRoute('/vault/$vaultId/settings/general')({
	component: GeneralPage,
})
