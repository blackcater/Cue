import type { AppInfo } from '@/types'

export class Environment {
	static get appInfo(): AppInfo | undefined {
		return window.__appInfo
	}

	static get isElectron(): boolean {
		return this.appInfo?.electron === true
	}

	static get isMacOS(): boolean {
		return this.appInfo?.platform === 'darwin' || false
	}
}
