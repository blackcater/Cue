import { createFileRoute } from '@tanstack/react-router'

import { AppearancePage } from '@renderer/pages/settings/AppearancePage'

export const Route = createFileRoute('/vault/settings/appearance')({
	component: AppearancePage,
})
