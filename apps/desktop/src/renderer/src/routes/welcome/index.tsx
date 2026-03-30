import { createFileRoute } from '@tanstack/react-router'

import { Wizard } from '@renderer/components/welcome'

export const Route = createFileRoute('/welcome/')({
	component: WelcomePage,
})

function WelcomePage() {
	return <Wizard />
}
