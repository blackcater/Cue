import { registerFilesHandlers } from './files'
import { registerSystemHandlers } from './system'

export async function registerHandlers() {
	await registerSystemHandlers()
	await registerFilesHandlers()
}
