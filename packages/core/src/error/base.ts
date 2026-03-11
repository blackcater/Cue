import { getMessageFromError } from './utils'

export enum ErrorScope {
	Unknown = 'unknown',
	User = 'user',
	System = 'system',
	ThirdParty = 'third_party',
}

export enum ErrorDomain {
	Acme = 'acme',
	Agent = 'agent',
	LLM = 'llm',
	MCP = 'mcp',
	Tool = 'tool',
}

export interface IErrorDefinition<Scope = string, Domain = string> {
	code: Uppercase<string>
	message?: string
	scope: Scope
	domain: Domain
	cause?: unknown
	details?: Record<string, unknown>
}

export class AcmeBaseError<Scope, Domain> extends Error {
	public override readonly message: string
	public override readonly cause?: unknown

	public readonly code: Uppercase<string>
	public readonly scope: Scope
	public readonly domain: Domain
	public readonly details?: Record<string, unknown>

	constructor(
		def: IErrorDefinition<Scope, Domain>,
		originalError?: string | Error | AcmeBaseError<Scope, Domain>
	) {
		const error = originalError ?? def.cause
		const msg = def.message
			? def.message
			: (getMessageFromError(error) ?? 'Unknown error')

		super(msg, { cause: error })

		this.message = msg
		this.code = def.code
		this.scope = def.scope
		this.domain = def.domain
		if (def.details) {
			this.details = def.details
		}
	}
}
