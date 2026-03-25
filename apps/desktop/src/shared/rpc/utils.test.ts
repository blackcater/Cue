import { describe, it, expect } from 'vitest'

import { generateId, extractRpcErrorMsg } from './utils'

describe('generateId', () => {
	it('should generate unique ids', () => {
		const id1 = generateId()
		const id2 = generateId()
		expect(id1).not.toBe(id2)
	})

	it('should be a non-empty string', () => {
		const id = generateId()
		expect(typeof id).toBe('string')
		expect(id.length).toBeGreaterThan(0)
	})
})

describe('extractRpcErrorMsg', () => {
	it('should extract message from Error', () => {
		const msg = extractRpcErrorMsg(new Error('test error'))
		expect(msg).toBe('test error')
	})

	it('should return default message for unknown', () => {
		const msg = extractRpcErrorMsg(null, 'default')
		expect(msg).toBe('default')
	})
})
