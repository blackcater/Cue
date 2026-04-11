import { useCallback, useEffect, useRef } from 'react'

import { useAtom, useAtomValue, useSetAtom } from 'jotai'

import type { API } from '@/types'
import { gitApi } from '@renderer/api'
import {
	currentProjectPathAtom,
	gitBranchesAtom,
	gitCurrentBranchAtom,
	gitDiffStatAtom,
	gitLogAtom,
	gitStatusAtom,
} from '@renderer/atoms/git'

/**
 * Default poll interval in milliseconds
 */
const DEFAULT_POLL_INTERVAL_MS = 3000

/**
 * Hook to manage git status with polling
 * @param pollIntervalMs - How often to poll for git status (default: 3000ms)
 */
export function useGitStatus(pollIntervalMs = DEFAULT_POLL_INTERVAL_MS) {
	const [projectPath] = useAtom(currentProjectPathAtom)
	const status = useAtomValue(gitStatusAtom)
	const currentBranch = useAtomValue(gitCurrentBranchAtom)
	const log = useAtomValue(gitLogAtom)
	const setGitStatus = useSetAtom(gitStatusAtom)
	const setGitBranches = useSetAtom(gitBranchesAtom)
	const setGitCurrentBranch = useSetAtom(gitCurrentBranchAtom)
	const setGitLog = useSetAtom(gitLogAtom)
	const setGitDiffStat = useSetAtom(gitDiffStatAtom)

	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const fetchGitData = useCallback(async () => {
		if (!projectPath) return

		try {
			const [status, branches, currentBranch, log, diffStat] =
				await Promise.all([
					gitApi.status(projectPath),
					gitApi.branches(projectPath),
					gitApi.currentBranch(projectPath),
					gitApi.log(projectPath),
					gitApi.diffStat(projectPath),
				])

			setGitStatus(status)
			setGitBranches(branches)
			setGitCurrentBranch(currentBranch)
			setGitLog(log)
			setGitDiffStat(diffStat)
		} catch (error) {
			console.error('Failed to fetch git data:', error)
		}
	}, [
		projectPath,
		setGitStatus,
		setGitBranches,
		setGitCurrentBranch,
		setGitLog,
		setGitDiffStat,
	])

	// Set up polling with visibility detection
	useEffect(() => {
		if (!projectPath) return

		const scheduleNextFetch = () => {
			// Clear any existing timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}

			timeoutRef.current = setTimeout(() => {
				// Only fetch if document is visible
				if (document.visibilityState === 'visible') {
					fetchGitData().then(scheduleNextFetch)
				}
				// When hidden, visibilitychange listener will trigger next fetch
			}, pollIntervalMs)
		}

		// Initial fetch
		fetchGitData().then(scheduleNextFetch)

		// Handle visibility changes
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				fetchGitData()
			}
		}

		document.addEventListener('visibilitychange', handleVisibilityChange)

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
			document.removeEventListener(
				'visibilitychange',
				handleVisibilityChange
			)
		}
	}, [projectPath, pollIntervalMs, fetchGitData])

	return {
		projectPath,
		status: status as API.GitStatus | null,
		currentBranch,
		log: log as API.GitLogEntry[],
		refresh: fetchGitData,
	}
}
