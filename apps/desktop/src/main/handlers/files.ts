import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { Container } from '@/shared/di'
import { ElectronRpcServer } from '@/shared/rpc'

const skippedDirs: Array<{ path: string; error: string }> = []

function logSkipped(dir: string, error: string): void {
	skippedDirs.push({ path: dir, error })
}

function getDirKey(inode: number, device: number): string {
	return `${device}:${inode}`
}

export async function registerFilesHandlers() {
	const server = Container.inject(ElectronRpcServer)

	const router = server.router('files')

	router.handle('list', async (dirPath: string) => {
		try {
			const entries = await fs.readdir(dirPath, { withFileTypes: true })
			const files = entries.map((entry) => {
				const fullPath = path.join(dirPath, entry.name)
				const extension = entry.isFile()
					? path.extname(entry.name).toLowerCase().slice(1)
					: undefined
				return {
					name: entry.name,
					path: fullPath,
					type: entry.isDirectory() ? 'directory' : 'file',
					extension,
				}
			})
			// Sort: directories first, then files, both alphabetically
			files.sort((a, b) => {
				if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
				return a.name.localeCompare(b.name)
			})
			return { files }
		} catch (error) {
			return { files: [], error: String(error) }
		}
	})

	router.handle('search', async (query: string, rootPath: string) => {
		// Reset skipped dirs for this search
		skippedDirs.length = 0

		const results: Array<{
			name: string
			path: string
			type: 'file' | 'directory'
		}> = []
		const maxResults = 100
		const maxDepth = 20
		const visitedDirs = new Set<string>()

		async function walk(dir: string, depth: number): Promise<void> {
			if (results.length >= maxResults) return
			if (depth > maxDepth) return

			try {
				// Check for symlink cycles using stat to get inode/device
				const stats = await fs.stat(dir)
				if (stats.isDirectory()) {
					const dirKey = getDirKey(stats.ino, stats.dev)
					if (visitedDirs.has(dirKey)) return
					visitedDirs.add(dirKey)
				}

				const entries = await fs.readdir(dir, { withFileTypes: true })
				for (const entry of entries) {
					if (results.length >= maxResults) break
					const fullPath = path.join(dir, entry.name)
					if (
						entry.name.toLowerCase().includes(query.toLowerCase())
					) {
						results.push({
							name: entry.name,
							path: fullPath,
							type: entry.isDirectory() ? 'directory' : 'file',
						})
					}
					if (entry.isDirectory() && !entry.name.startsWith('.')) {
						await walk(fullPath, depth + 1)
					}
				}
			} catch (error) {
				logSkipped(dir, String(error))
			}
		}

		await walk(rootPath, 0)
		return { results, skippedCount: skippedDirs.length }
	})
}
