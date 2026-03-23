import { z } from 'zod'

export const VaultSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  createdAt: z.string(),
})

export const ProjectSchema = z.object({
  id: z.string(),
  vaultId: z.string(),
  name: z.string(),
  path: z.string(),
  createdAt: z.string(),
})

export const FolderSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  createdAt: z.string(),
})

export const ThreadSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  folderId: z.string().optional(),
  agentId: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const MessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  role: z.enum(['user', 'agent']),
  content: z.string(),
  timestamp: z.string(),
})

export const AgentConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['claude-code', 'codex', 'acmex']),
  name: z.string(),
  config: z.record(z.string(), z.unknown()),
})

export type Vault = z.infer<typeof VaultSchema>
export type Project = z.infer<typeof ProjectSchema>
export type Folder = z.infer<typeof FolderSchema>
export type Thread = z.infer<typeof ThreadSchema>
export type Message = z.infer<typeof MessageSchema>
export type AgentConfig = z.infer<typeof AgentConfigSchema>
