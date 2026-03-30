import { useCallback } from 'react'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/vault/$vaultId/')({
	component: HomePage,
})

function HomePage() {
	const rpc = window.api.rpc

	const handleOpenChat = useCallback(() => {
		try {
			rpc.call('/system/window/create-popup', 'thread-1')
		} catch (error) {
			console.error('Failed to create popup:', error)
		}
	}, [rpc])

	return (
		<div className="flex h-full items-center justify-center">
			<button onClick={handleOpenChat}>打开 Chat</button>
		</div>
	)
}
