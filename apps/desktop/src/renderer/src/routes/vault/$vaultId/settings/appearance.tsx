import { createFileRoute } from '@tanstack/react-router'

import { AppearancePage } from './-AppearancePage'

export const Route = createFileRoute('/vault/$vaultId/settings/appearance')({
	component: AppearancePage,
})
