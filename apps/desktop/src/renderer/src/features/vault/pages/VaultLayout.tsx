import type React from 'react'
import {
	Panel,
	Group,
	Separator,
	useDefaultLayout,
	type PanelSize,
} from 'react-resizable-panels'

import { useAtom } from 'jotai'

import { AppHeader } from '@renderer/components/AppHeader'
import { AppSidebar } from '@renderer/components/AppSidebar'
import { sidebarAtom } from '@renderer/stores'

export interface VaultLayoutProps {
	children: React.ReactNode
}

export function VaultLayout({ children }: Readonly<VaultLayoutProps>) {
	const [sidebar, setSidebar] = useAtom(sidebarAtom)
	const {
		defaultLayout: sidebarLayout,
		onLayoutChanged: onSidebarLayoutChanged,
	} = useDefaultLayout({
		id: 'layout-sidebar',
		storage: localStorage,
	})

	function handleSidebarToggle() {
		setSidebar((prev) => ({ ...prev, collapsed: !prev.collapsed }))
	}

	function handleSidebarResize(size: PanelSize) {
		setSidebar((prev) => ({ ...prev, width: size.inPixels }))
	}

	return (
		<div className="relative z-1 flex h-full w-full flex-1 flex-col">
			<AppHeader onSidebarToggle={handleSidebarToggle} />
			<Group
				orientation="horizontal"
				defaultLayout={sidebarLayout}
				onLayoutChanged={onSidebarLayoutChanged}
			>
				{!sidebar.collapsed && (
					<Panel
						id="sidebar"
						minSize={250}
						maxSize={350}
						onResize={handleSidebarResize}
					>
						<AppSidebar />
					</Panel>
				)}

				<Separator className="hover:bg-primary/20 my-4 w-0.5 bg-transparent transition-colors" />

				<Panel id="main">
					<div className="flex h-full w-full flex-1 flex-col overflow-hidden py-1 pr-1">
						<main className="h-full w-full rounded-lg">
							{children}
						</main>
					</div>
				</Panel>
			</Group>
		</div>
	)
}
