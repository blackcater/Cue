export interface Vault {
	id: string
	name: string
	path: string
	createdAt: Date
}

export interface Project {
	id: string
	vaultId: string
	name: string
	path: string
	createdAt: Date
}

export interface Folder {
	id: string
	projectId: string
	name: string
	createdAt: Date
}

export interface Thread {
	id: string
	projectId: string
	folderId?: string
	agentId: string
	title: string
	createdAt: Date
	updatedAt: Date
}

export interface Message {
	id: string
	threadId: string
	role: 'user' | 'agent'
	content: string
	timestamp: Date
}

export interface AgentProcessOptions {
	env?: Record<string, string>
	cwd?: string
}

export interface AgentStatus {
	running: string[]
	available: string[]
}
