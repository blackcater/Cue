import { is } from '@electron-toolkit/utils'
import log from 'electron-log/main'

// Configure transports based on debug mode
if (is.dev) {
	// JSON format for file (agent-parseable)
	// Note: format expects (params: FormatParams) => any[], where params.message has the LogMessage fields
	log.transports.file.format = ({ message }) => [
		JSON.stringify({
			timestamp: message.date.toISOString(),
			level: message.level,
			scope: message.scope,
			message: message.data,
		}),
	]

	log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB

	// Console output in debug mode with readable format
	// Note: format must return an array - electron-log's transformStyles calls .reduce() on it
	log.transports.console.format = ({ message }) => {
		const scope = message.scope ? `[${message.scope}]` : ''
		const level = message.level.toUpperCase().padEnd(5)
		const data = message.data
			.map((d: unknown) =>
				typeof d === 'object' ? JSON.stringify(d) : String(d)
			)
			.join(' ')
		return [`${message.date.toISOString()} ${level} ${scope} ${data}`]
	}
	log.transports.console.level = 'debug'
} else {
	// Disable file and console transports in production
	log.transports.file.level = false
	log.transports.console.level = false
}

// Export scoped loggers for different modules
export const mainLog = log.scope('main')
export const sessionLog = log.scope('session')
export const handlerLog = log.scope('handler')
export const windowLog = log.scope('window')
export const agentLog = log.scope('agent')
export const searchLog = log.scope('search')

/**
 * Get the path to the current log file.
 * Returns undefined if file logging is disabled.
 */
export function getLogFilePath(): string | undefined {
	if (!is.dev) return undefined
	return log.transports.file.getFile()?.path
}

export { log }
