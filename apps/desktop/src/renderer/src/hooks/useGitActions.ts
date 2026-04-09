import { useCallback } from 'react'

import { useAtomValue } from 'jotai'

import { gitApi } from '@renderer/api'
import { currentProjectPathAtom } from '@renderer/atoms/git'

/**
 * Hook to provide git actions
 * All actions operate on the current project path
 */
export function useGitActions() {
	const projectPath = useAtomValue(currentProjectPathAtom)

	const stage = useCallback(
		async (files: string[]) => {
			if (!projectPath)
				return { success: false, message: 'No project path' }
			try {
				await gitApi.stage(projectPath, files)
				return { success: true }
			} catch (error) {
				return { success: false, message: String(error) }
			}
		},
		[projectPath]
	)

	const unstage = useCallback(
		async (files: string[]) => {
			if (!projectPath)
				return { success: false, message: 'No project path' }
			try {
				await gitApi.unstage(projectPath, files)
				return { success: true }
			} catch (error) {
				return { success: false, message: String(error) }
			}
		},
		[projectPath]
	)

	const stageAll = useCallback(async () => {
		if (!projectPath) return { success: false, message: 'No project path' }
		try {
			await gitApi.stageAll(projectPath)
			return { success: true }
		} catch (error) {
			return { success: false, message: String(error) }
		}
	}, [projectPath])

	const unstageAll = useCallback(async () => {
		if (!projectPath) return { success: false, message: 'No project path' }
		try {
			await gitApi.unstageAll(projectPath)
			return { success: true }
		} catch (error) {
			return { success: false, message: String(error) }
		}
	}, [projectPath])

	const discard = useCallback(
		async (files: string[]) => {
			if (!projectPath)
				return { success: false, message: 'No project path' }
			try {
				await gitApi.discard(projectPath, files)
				return { success: true }
			} catch (error) {
				return { success: false, message: String(error) }
			}
		},
		[projectPath]
	)

	const commit = useCallback(
		async (message: string) => {
			if (!projectPath)
				return { success: false, message: 'No project path' }
			try {
				const result = await gitApi.commit(projectPath, message)
				return { success: true, hash: result.hash }
			} catch (error) {
				return { success: false, message: String(error) }
			}
		},
		[projectPath]
	)

	const checkout = useCallback(
		async (branch: string) => {
			if (!projectPath)
				return { success: false, message: 'No project path' }
			try {
				const result = await gitApi.checkout(projectPath, branch)
				return result
			} catch (error) {
				return { success: false, message: String(error) }
			}
		},
		[projectPath]
	)

	const createBranch = useCallback(
		async (name: string) => {
			if (!projectPath)
				return { success: false, message: 'No project path' }
			try {
				await gitApi.createBranch(projectPath, name)
				return { success: true }
			} catch (error) {
				return { success: false, message: String(error) }
			}
		},
		[projectPath]
	)

	const push = useCallback(async () => {
		if (!projectPath) return { success: false, message: 'No project path' }
		try {
			const result = await gitApi.push(projectPath)
			return result
		} catch (error) {
			return { success: false, message: String(error) }
		}
	}, [projectPath])

	const pull = useCallback(async () => {
		if (!projectPath) return { success: false, message: 'No project path' }
		try {
			const result = await gitApi.pull(projectPath)
			return result
		} catch (error) {
			return { success: false, message: String(error) }
		}
	}, [projectPath])

	const fetch = useCallback(async () => {
		if (!projectPath) return { success: false, message: 'No project path' }
		try {
			await gitApi.fetch(projectPath)
			return { success: true }
		} catch (error) {
			return { success: false, message: String(error) }
		}
	}, [projectPath])

	const generateCommitMessage = useCallback(async () => {
		if (!projectPath) return ''
		try {
			return await gitApi.generateCommitMessage(projectPath)
		} catch (error) {
			console.error('Failed to generate commit message:', error)
			return ''
		}
	}, [projectPath])

	return {
		stage,
		unstage,
		stageAll,
		unstageAll,
		discard,
		commit,
		checkout,
		createBranch,
		push,
		pull,
		fetch,
		generateCommitMessage,
	}
}
