import type { StandardSchemaV1 } from '@standard-schema/spec'
import { RpcError } from './RpcError'

class AbortSignalCarrier {
  listeners: Array<() => void> = []

  onabort(fn: () => void): void {
    this.listeners.push(fn)
  }
}

export interface CancelToken {
  readonly aborted: boolean
  readonly signal: { onabort: (fn: () => void) => void }
  abort(): void
}

export function createCancelToken(): CancelToken {
  let aborted = false
  const carrier = new AbortSignalCarrier()

  const signal = {
    onabort: (fn: () => void) => {
      if (aborted) {
        fn()
      } else {
        carrier.listeners.push(fn)
      }
    },
  }

  return {
    get aborted() { return aborted },
    get signal() { return signal },
    abort() {
      if (aborted) return
      aborted = true
      carrier.listeners.forEach((fn) => fn())
    },
  }
}

export function validateArgs(
  schema: StandardSchemaV1 | undefined,
  args: unknown[]
): { validatedArgs: unknown[] } {
  if (!schema) {
    return { validatedArgs: args }
  }

  const input = args.length === 1 ? args[0] : args
  const result = schema['~standard'].validate(input)

  // Handle potential Promise result (async schema validation)
  if (result instanceof Promise) {
    throw new RpcError('INVALID_PARAMS', 'Async schema validation not supported')
  }

  if ('issues' in result && result.issues) {
    throw new RpcError(
      'INVALID_PARAMS',
      'Invalid parameters',
      result.issues.map((i) => i.message)
    )
  }

  // TypeScript doesn't understand the union type narrowing here
  const value = (result as { value: unknown }).value
  return {
    validatedArgs: Array.isArray(value) ? value : [value],
  }
}
