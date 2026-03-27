import { useState } from 'react'
import {
	LeftSidebar,
	TopBar,
	HeroSection,
	InputArea,
} from '~/src/renderer/src/components/app-shell'

export function HomePage() {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

	const handleToggleSidebar = () => {
		setSidebarCollapsed((prev) => !prev)
	}

	return (
		<div className="flex h-screen w-screen overflow-hidden">
			{/* Left Sidebar - Collapsible */}
			<LeftSidebar
				isCollapsed={sidebarCollapsed}
				onToggle={handleToggleSidebar}
			/>

			{/* Main Content Area */}
			<main className="flex flex-1 flex-col">
				{/* Top Bar */}
				<TopBar className="shrink-0" />

				{/* Hero Section */}
				<HeroSection className="flex-1" />

				{/* Input Area */}
				<InputArea className="shrink-0" />
			</main>
		</div>
	)
}
