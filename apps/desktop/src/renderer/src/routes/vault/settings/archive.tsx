import { createFileRoute } from '@tanstack/react-router'

import { ArchivePage } from '@renderer/pages/settings/ArchivePage'

export const Route = createFileRoute('/vault/settings/archive')({
	component: ArchivePage,
})
