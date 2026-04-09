import type { BrowserHandler } from '@/main/handlers/browser'
import type { FilesHandler } from '@/main/handlers/files'
import type { GitHandler } from '@/main/handlers/git'
import type { RpcClient } from '@/shared/rpc'
import type { AppInfo } from '@/types'

interface StoreAPI {
	get: (key: 'firstLaunchDone') => Promise<boolean>
	set: (key: 'firstLaunchDone', value: boolean) => Promise<void>
	getLocale: () => Promise<string>
	setLocale: (locale: string) => Promise<void>
}

export interface API {
	files: Pick<FilesHandler, 'list' | 'search'>
	git: Pick<
		GitHandler,
		| 'status'
		| 'branches'
		| 'currentBranch'
		| 'log'
		| 'diffStat'
		| 'stage'
		| 'unstage'
		| 'stageAll'
		| 'unstageAll'
		| 'discard'
		| 'commit'
		| 'checkout'
		| 'createBranch'
		| 'push'
		| 'pull'
		| 'fetch'
		| 'generateCommitMessage'
	>
	browser: Pick<
		BrowserHandler,
		| 'create'
		| 'destroy'
		| 'list'
		| 'navigate'
		| 'goBack'
		| 'goForward'
		| 'reload'
		| 'stop'
		| 'focus'
		| 'screenshot'
		| 'getAccessibilitySnapshot'
		| 'clickElement'
		| 'fillElement'
		| 'selectOption'
	>
	store: StoreAPI
	rpc: RpcClient
}

declare global {
	interface Window {
		api: API
		__appInfo: AppInfo
	}
}
