import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAtom } from 'jotai'

import { Chat } from '@renderer/components/chat/Chat'
import { panelAtom } from '@renderer/atoms/panel'
import { useHeader } from '@renderer/contexts/HeaderContext'

export const Route = createFileRoute('/vault/$vaultId/thread/$threadId')({
	component: ThreadPage,
})

export function ThreadPage(): React.JSX.Element {
	const { threadId } = Route.useParams()
	const [panel, setPanel] = useAtom(panelAtom)
	const { setContent } = useHeader()

	useEffect(() => {
		setContent({
			title: `Thread: ${threadId}`,
			actions: [
				<button
					key="panel-toggle"
					onClick={() => setPanel((prev) => ({ ...prev, collapsed: !prev.collapsed }))}
					className="px-2 py-1 text-sm"
				>
					{panel.collapsed ? '展开' : '折叠'}
				</button>,
			],
		})
	}, [threadId, panel.collapsed, setPanel, setContent])

	if (!threadId) {
		return null
	}

	return <Chat threadId={threadId} />
}
