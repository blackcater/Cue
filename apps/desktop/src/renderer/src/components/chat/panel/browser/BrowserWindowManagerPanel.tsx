import { useEffect, useCallback } from 'react'

import { useAtomValue, useSetAtom } from 'jotai'

import { browserApi } from '@renderer/api'
import {
	browserInstancesMapAtom,
	removeBrowserInstanceAtom,
	updateBrowserInstanceAtom,
} from '@renderer/atoms/browser'

import { BrowserWindowList } from './BrowserWindowList'
import { BrowserWindowManagerHeader } from './BrowserWindowManagerHeader'
import { NewBrowserButton } from './NewBrowserButton'

export function BrowserWindowManagerPanel() {
	const browserInstancesMap = useAtomValue(browserInstancesMapAtom)
	const setBrowserInstancesMap = useSetAtom(browserInstancesMapAtom)
	const removeBrowserInstance = useSetAtom(removeBrowserInstanceAtom)
	const updateBrowserInstance = useSetAtom(updateBrowserInstanceAtom)

	// Sync browser instances from main process
	const syncBrowserInstances = useCallback(async () => {
		try {
			const instances = await browserApi.list()
			const newMap = new Map()

			for (const info of instances) {
				newMap.set(info.id, {
					id: info.id,
					url: info.url,
					title: info.title,
					isLoading: false, // TODO: track loading state
					canGoBack: info.canGoBack,
					canGoForward: info.canGoForward,
					isVisible: true,
					ownerType: 'user', // TODO: determine owner
					agentControlActive: false,
				})
			}

			setBrowserInstancesMap(newMap)
		} catch (error) {
			console.error('Failed to sync browser instances:', error)
		}
	}, [setBrowserInstancesMap])

	// Initial sync and polling
	useEffect(() => {
		syncBrowserInstances()

		// Poll for updates every 2 seconds
		const interval = setInterval(syncBrowserInstances, 2000)

		return () => clearInterval(interval)
	}, [syncBrowserInstances])

	const handleNewWindow = useCallback(async () => {
		try {
			await browserApi.create()
			await syncBrowserInstances()
		} catch (error) {
			console.error('Failed to create browser window:', error)
		}
	}, [syncBrowserInstances])

	const handleFocusInstance = useCallback(
		async (instanceId: string) => {
			try {
				await browserApi.focus(instanceId)
				updateBrowserInstance(
					instanceId,
					(prev) =>
						prev ?? {
							id: instanceId,
							url: '',
							title: '',
							isLoading: false,
							canGoBack: false,
							canGoForward: false,
							isVisible: true,
							ownerType: 'user',
							agentControlActive: false,
						}
				)
			} catch (error) {
				console.error('Failed to focus browser instance:', error)
			}
		},
		[updateBrowserInstance]
	)

	const handleCloseInstance = useCallback(
		async (instanceId: string) => {
			try {
				await browserApi.destroy(instanceId)
				removeBrowserInstance(instanceId)
			} catch (error) {
				console.error('Failed to close browser instance:', error)
			}
		},
		[removeBrowserInstance]
	)

	return (
		<div className="flex h-full flex-col">
			<BrowserWindowManagerHeader
				windowCount={browserInstancesMap.size}
				onNewWindow={handleNewWindow}
			/>
			<div className="flex-1 overflow-hidden">
				<BrowserWindowList
					onFocusInstance={handleFocusInstance}
					onCloseInstance={handleCloseInstance}
				/>
			</div>
			<div className="p-2">
				<NewBrowserButton />
			</div>
		</div>
	)
}
