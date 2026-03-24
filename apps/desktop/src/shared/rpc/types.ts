export type Target =
  | { type: 'broadcast' }
  | { type: 'group'; groupId: string }

export interface RpcRequest {
  id: string
  method: string
  args: unknown
}

export interface RpcResponse {
  id: string
  result?: unknown
  error?: import('./RpcError').RpcError
}

export interface RpcStreamChunk {
  id: string
  chunk: unknown
  done?: boolean
}

export interface RpcPushMessage {
  event: string
  target: Target
  args: unknown[]
}
