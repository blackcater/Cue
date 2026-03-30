import { describe, it, expect, afterEach } from 'bun:test'

import { AppStore, store } from './store'

describe('AppStore', () => {
	afterEach(() => {
		store.clear()
	})

	it('should return false for firstLaunchDone by default', () => {
		const s = new AppStore()
		expect(s.firstLaunchDone).toBe(false)
	})

	it('should set and get firstLaunchDone', () => {
		const s = new AppStore()
		s.firstLaunchDone = true
		expect(s.firstLaunchDone).toBe(true)
	})
})
