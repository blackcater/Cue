import { z } from 'zod'
import { VaultSchema, ProjectSchema, ThreadSchema, MessageSchema } from './types'

export const vaultContracts = {
  list: {
    input: z.undefined(),
    output: z.array(VaultSchema),
  },
  create: {
    input: z.object({ name: z.string(), path: z.string() }),
    output: VaultSchema,
  },
  get: {
    input: z.object({ vaultId: z.string() }),
    output: VaultSchema,
  },
}

export const projectContracts = {
  list: {
    input: z.object({ vaultId: z.string() }),
    output: z.array(ProjectSchema),
  },
  create: {
    input: z.object({ vaultId: z.string(), name: z.string(), path: z.string() }),
    output: ProjectSchema,
  },
}

export const threadContracts = {
  list: {
    input: z.object({ projectId: z.string() }),
    output: z.array(ThreadSchema),
  },
  create: {
    input: z.object({
      projectId: z.string(),
      agentId: z.string(),
      title: z.string(),
      folderId: z.string().optional(),
    }),
    output: ThreadSchema,
  },
  get: {
    input: z.object({ threadId: z.string() }),
    output: ThreadSchema,
  },
  delete: {
    input: z.object({ threadId: z.string() }),
    output: z.boolean(),
  },
}

export const messageContracts = {
  list: {
    input: z.object({ threadId: z.string(), limit: z.number().optional() }),
    output: z.array(MessageSchema),
  },
  send: {
    input: z.object({ threadId: z.string(), content: z.string() }),
    output: MessageSchema,
  },
}

export const agentContracts = {
  start: {
    input: z.object({ agentId: z.string(), threadId: z.string() }),
    output: z.object({ success: z.boolean() }),
  },
  stop: {
    input: z.object({ agentId: z.string() }),
    output: z.object({ success: z.boolean() }),
  },
  getStatus: {
    input: z.undefined(),
    output: z.object({
      running: z.array(z.string()),
      available: z.array(z.string()),
    }),
  },
  sendMessage: {
    input: z.object({ agentId: z.string(), content: z.string() }),
    output: z.object({ messageId: z.string() }),
  },
}
