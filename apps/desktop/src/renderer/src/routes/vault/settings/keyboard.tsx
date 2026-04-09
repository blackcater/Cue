import { createFileRoute } from '@tanstack/react-router'

import { KeyboardPage } from '@renderer/pages/settings/KeyboardPage'

export const Route = createFileRoute('/vault/settings/keyboard')({
	component: KeyboardPage,
})
