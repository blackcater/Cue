import { createFileRoute } from '@tanstack/react-router'

import { GitPage } from './-GitPage'

export const Route = createFileRoute('/vault/$vaultId/settings/git')({
	component: GitPage,
})
