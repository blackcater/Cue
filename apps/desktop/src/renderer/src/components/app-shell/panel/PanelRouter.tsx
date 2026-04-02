import type { PanelType } from '@renderer/types/panel'

import { FilesPanel } from './FilesPanel'
import { GitPanel } from './GitPanel'
import { OutlinePanel } from './OutlinePanel'

interface PanelRouterProps {
	type: PanelType
}

export function PanelRouter({
	type,
}: PanelRouterProps): React.JSX.Element | null {
	switch (type) {
		case 'git':
			return <GitPanel />
		case 'files':
			return <FilesPanel />
		case 'outline':
			return <OutlinePanel />
		default:
			return null
	}
}
