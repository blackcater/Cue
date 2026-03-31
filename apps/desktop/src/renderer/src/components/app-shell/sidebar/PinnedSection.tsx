// apps/desktop/src/renderer/src/components/app-shell/sidebar/PinnedSection.tsx
import { useAtomValue } from 'jotai'

import { threadsAtom, pinnedThreadsAtom } from '../atoms/thread-atoms'
import { ThreadCell } from './cell/ThreadCell'
import { TitleCell } from './cell/TitleCell'

export function PinnedSection() {
	const threads = useAtomValue(threadsAtom)
	const pinnedIds = useAtomValue(pinnedThreadsAtom)

	const pinnedThreads = threads.filter((t) => pinnedIds.has(t.id))

	if (pinnedThreads.length === 0) {
		return null
	}

	return (
		<section className="flex flex-col gap-1 px-2">
			<TitleCell title="Pinned" />
			<div className="flex flex-col gap-0.5">
				{pinnedThreads.map((thread) => (
					<ThreadCell key={thread.id} thread={thread} isPinned />
				))}
			</div>
		</section>
	)
}
