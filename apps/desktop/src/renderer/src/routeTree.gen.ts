import { createRootRoute, createRoute } from '@tanstack/react-router'

import { RootComponent } from './routes/__root'
import { ChatPage } from './routes/chat'
import { HomePage } from './routes/index'
import { SettingsPage } from './routes/settings'

// Root route
export const rootRoute = createRootRoute({
	component: RootComponent,
})

// Home route
export const homeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	component: HomePage,
})

// Settings route
export const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings',
	component: SettingsPage,
})

// Chat route
export const chatRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/chat',
	component: ChatPage,
})

// Create route tree
export const routeTree = rootRoute.addChildren([
	homeRoute,
	settingsRoute,
	chatRoute,
])
