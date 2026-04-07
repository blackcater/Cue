import { createFileRoute } from '@tanstack/react-router'

import { WelcomePage } from '@renderer/features/onboarding/pages/WelcomePage'

export const Route = createFileRoute('/welcome/')({
	component: WelcomePage,
})
