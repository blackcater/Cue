import os from 'node:os'
import path from 'node:path'

import Store from 'electron-store'

interface StoreSchema {
	firstLaunchDone: boolean
}

export const store = new Store<StoreSchema>({
	name: 'config',
	schema: {
		firstLaunchDone: {
			type: 'boolean',
			default: false,
		},
	},
	cwd: path.join(os.homedir(), '.acme'),
})

export class AppStore {
	get firstLaunchDone(): boolean {
		return store.get('firstLaunchDone')
	}

	set firstLaunchDone(value: boolean) {
		store.set('firstLaunchDone', value)
	}
}
