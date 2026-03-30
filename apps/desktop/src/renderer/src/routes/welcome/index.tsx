import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/welcome/')({
	component: WelcomePage,
})

function WelcomePage() {
	const rpc = window.api.getRpcClient()

	const handleStart = () => {
		rpc.call('/system/window/create-vault', 'vault-1')
	}

	return (
		<div className="flex h-full items-center justify-center">
			<button onClick={handleStart}>开始</button>
		</div>
	)
}
