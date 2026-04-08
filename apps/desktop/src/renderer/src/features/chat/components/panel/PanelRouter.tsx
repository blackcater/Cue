import type { PanelType } from '@renderer/types/panel'

import { BrowserPanel } from './BrowserPanel'
import { GitPanel } from './GitPanel'
import { PreviewPanel } from './PreviewPanel'
import { FilesPanel } from './files'

interface PanelRouterProps {
	type?: PanelType
}

export function PanelRouter({ type }: Readonly<PanelRouterProps>) {
	switch (type) {
		case 'git':
			return <GitPanel />
		case 'files':
			return <FilesPanel />
		case 'browser':
			return <BrowserPanel />
		case 'preview':
			return <PreviewPanel />
		case 'outline':
			// TODO: Replace with OutlinePanel
			return <div className="p-4 text-xs text-muted-foreground">Outline Panel (TBD)</div>
		case 'projectFiles':
			// TODO: Replace with ProjectFilesPanel
			return <div className="p-4 text-xs text-muted-foreground">Project Files Panel (TBD)</div>
		default:
			return null
	}
}
