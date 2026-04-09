import { createFileRoute } from '@tanstack/react-router'

import { WelcomePage } from '@renderer/pages/onboarding/WelcomePage'

export const Route = createFileRoute('/welcome/')({
	component: WelcomePage,
})
