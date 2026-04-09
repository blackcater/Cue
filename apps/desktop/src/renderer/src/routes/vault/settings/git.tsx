import { createFileRoute } from '@tanstack/react-router'

import { GitPage } from '@renderer/pages/settings/GitPage'

export const Route = createFileRoute('/vault/settings/git')({
	component: GitPage,
})
