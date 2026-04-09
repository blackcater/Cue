import { createFileRoute } from '@tanstack/react-router'

import { NotificationsPage } from '@renderer/pages/settings/NotificationsPage'

export const Route = createFileRoute('/vault/settings/notifications')({
	component: NotificationsPage,
})
