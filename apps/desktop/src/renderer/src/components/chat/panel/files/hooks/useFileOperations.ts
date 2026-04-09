import { useCallback } from 'react'

import type { FileNode } from '@/main/handlers/files.schema'

export function useFileOperations() {
	const listFiles = useCallback(
		async (dirPath: string): Promise<FileNode[]> => {
			const response = await window.api.files.list(dirPath)
			if (response.error) {
				console.error('Failed to list files:', response.error)
				return []
			}
			return response.files
		},
		[]
	)

	const searchFiles = useCallback(
		async (
			query: string,
			rootPath: string
		): Promise<
			Array<{ name: string; path: string; type: 'file' | 'directory' }>
		> => {
			if (!query.trim()) return []
			try {
				const response = await window.api.files.search(query, rootPath)
				return response.results
			} catch (error) {
				console.error('Failed to search files:', error)
				return []
			}
		},
		[]
	)

	return {
		listFiles,
		searchFiles,
	}
}
