import { createFileRoute } from '@tanstack/react-router'

import { Wizard } from './Wizard'

export const Route = createFileRoute('/welcome/')({
	component: WelcomePage,
})

function WelcomePage() {
	return <Wizard />
}
