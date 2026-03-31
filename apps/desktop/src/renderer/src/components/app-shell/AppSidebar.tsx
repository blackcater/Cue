import { ScrollArea } from '@acme-ai/ui/foundation'

import { ProjectSection } from './sidebar/ProjectSection'
import { SidebarFooter } from './sidebar/SidebarFooter'
import { SidebarHeader } from './sidebar/SidebarHeader'

export function AppSidebar(): React.JSX.Element {
	return (
		<aside className="text-secondary-foreground relative flex w-[256px] shrink-0 flex-col">
			<SidebarHeader />
			{/* Sidebar Content */}
			<ScrollArea className="flex-1">
				{/* Thread Section */}
				<ProjectSection />
			</ScrollArea>
			{/* Sidebar Footer */}
			<SidebarFooter />
		</aside>
	)
}
