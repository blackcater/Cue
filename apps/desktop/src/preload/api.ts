import { contextBridge, ipcRenderer } from 'electron'

import type { BrowserHandler } from '@main/handlers/browser'
import type { FilesHandler } from '@main/handlers/files'
import type { GitHandler } from '@main/handlers/git'

import { IpcRendererRpcClient } from '@/shared/rpc/electron'

import type { API } from './preload'
import { buildCallApi, createRpc } from './utils'

const client = new IpcRendererRpcClient(ipcRenderer)
const rpc = createRpc(client)

const store = {
	get: (key: 'firstLaunchDone'): Promise<boolean> =>
		rpc.call('/system/store/get', key),
	set: (key: 'firstLaunchDone', value: boolean): Promise<void> =>
		rpc.call('/system/store/set', key, value),
	getLocale: (): Promise<string> => rpc.call('/system/locale/get'),
	setLocale: (locale: string): Promise<void> =>
		rpc.call('/system/locale/set', locale),
}

const api: API = {
	files: buildCallApi<FilesHandler>('files', ['list', 'search'], rpc),
	git: buildCallApi<GitHandler>(
		'git',
		[
			'status',
			'branches',
			'currentBranch',
			'log',
			'diffStat',
			'stage',
			'unstage',
			'stageAll',
			'unstageAll',
			'discard',
			'commit',
			'checkout',
			'createBranch',
			'push',
			'pull',
			'fetch',
			'generateCommitMessage',
		],
		rpc
	),
	browser: buildCallApi<BrowserHandler>(
		'browser',
		[
			'create',
			'destroy',
			'list',
			'navigate',
			'goBack',
			'goForward',
			'reload',
			'stop',
			'focus',
			'screenshot',
			'getAccessibilitySnapshot',
			'clickElement',
			'fillElement',
			'selectOption',
		],
		rpc
	),
	store,
	rpc,
}

if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('api', api)
	} catch (error) {
		console.error(error)
	}
}
