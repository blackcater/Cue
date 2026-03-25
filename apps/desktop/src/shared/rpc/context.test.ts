import { describe, it, expect } from 'vitest'
import { createCancelToken, validateArgs } from './context'
import { z } from 'zod'

describe('CancelToken', () => {
  it('should not be aborted initially', () => {
    const token = createCancelToken()
    expect(token.aborted).toBe(false)
  })

  it('should call onabort when aborted', () => {
    const token = createCancelToken()
    let called = false
    token.signal.onabort(() => { called = true })
    token.abort()
    expect(called).toBe(true)
    expect(token.aborted).toBe(true)
  })

  it('should call multiple onabort listeners', () => {
    const token = createCancelToken()
    let count = 0
    token.signal.onabort(() => { count++ })
    token.signal.onabort(() => { count++ })
    token.abort()
    expect(count).toBe(2)
  })
})

describe('validateArgs', () => {
  it('should return args as-is when no schema', () => {
    const { validatedArgs } = validateArgs(undefined, [1, 'test'])
    expect(validatedArgs).toEqual([1, 'test'])
  })

  it('should validate with schema', () => {
    const schema = z.object({ name: z.string() })
    const { validatedArgs } = validateArgs(schema as any, [{ name: 'test' }])
    expect(validatedArgs).toEqual([{ name: 'test' }])
  })

  it('should throw INVALID_PARAMS on validation failure', () => {
    const schema = z.object({ name: z.string() })
    expect(() => validateArgs(schema as any, [{ name: 123 }]))
      .toThrow('Invalid parameters')
  })
})
