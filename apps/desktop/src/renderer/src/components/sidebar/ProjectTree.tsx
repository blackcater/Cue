import { useEffect, useState } from 'react'

import type { Project, Thread } from '@/shared/ipc/types'

import { ThreadItem } from './ThreadItem'

interface ProjectTreeProps {
	vaultId: string
	selectedThreadId: string | undefined
	onThreadSelect: (threadId: string) => void
}

interface FolderGroup {
	[folderId: string]: Thread[]
}

export function ProjectTree({
	vaultId,
	selectedThreadId,
	onThreadSelect,
}: Readonly<ProjectTreeProps>): React.JSX.Element {
	const [projects, setProjects] = useState<Project[]>([])
	const [threadsByProject, setThreadsByProject] = useState<
		Record<string, Thread[]>
	>({})
	const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
		new Set()
	)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		if (vaultId) {
			loadProjects()
		}
	}, [vaultId])

	async function loadProjects(): Promise<void> {
		setIsLoading(true)
		try {
			const result = await window.api.invoke<Project[]>('project:list', {
				vaultId,
			})
			setProjects(result)

			// Load threads for each project in parallel
			const threadsMap: Record<string, Thread[]> = {}
			const threadPromises = result.map(
				async (project): Promise<[string, Thread[]]> => {
					const threads = await window.api.invoke<Thread[]>(
						'thread:list',
						{ projectId: project.id }
					)
					return [project.id, threads]
				}
			)
			const threadResults = await Promise.all(threadPromises)
			for (const [projectId, threads] of threadResults) {
				threadsMap[projectId] = threads
			}
			setThreadsByProject(threadsMap)
		} catch (error) {
			console.error('Failed to load projects:', error)
		} finally {
			setIsLoading(false)
		}
	}

	function toggleProject(projectId: string): void {
		setExpandedProjects((prev) => {
			const next = new Set(prev)
			if (next.has(projectId)) {
				next.delete(projectId)
			} else {
				next.add(projectId)
			}
			return next
		})
	}

	function groupThreadsByFolder(threads: Thread[]): FolderGroup {
		const grouped: FolderGroup = { undefined: [] }
		for (const thread of threads) {
			const folderId = thread.folderId ?? 'undefined'
			if (!grouped[folderId]) {
				grouped[folderId] = []
			}
			grouped[folderId].push(thread)
		}
		return grouped
	}

	if (!vaultId) {
		return (
			<div className="text-muted-foreground px-3 py-2 text-sm">
				Select a vault to view projects
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className="text-muted-foreground px-3 py-2 text-sm">
				Loading...
			</div>
		)
	}

	if (projects.length === 0) {
		return (
			<div className="text-muted-foreground px-3 py-2 text-sm">
				No projects found
			</div>
		)
	}

	return (
		<div className="space-y-1 py-2">
			{projects.map((project) => {
				const isExpanded = expandedProjects.has(project.id)
				const threads = threadsByProject[project.id] ?? []
				const groupedThreads = groupThreadsByFolder(threads)

				return (
					<div key={project.id}>
						<button
							type="button"
							onClick={() => toggleProject(project.id)}
							className="hover:bg-accent flex h-8 w-full items-center gap-2 px-3 text-sm"
						>
							<svg
								className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
							<span className="truncate font-medium">
								{project.name}
							</span>
						</button>

						{isExpanded && (
							<div className="ml-4">
								{Object.entries(groupedThreads).map(
									([folderId, folderThreads]) => (
										<div
											key={folderId}
											className="space-y-0.5"
										>
											{folderId !== 'undefined' && (
												<div className="text-muted-foreground px-3 py-1 text-xs font-semibold uppercase">
													{folderId}
												</div>
											)}
											{folderThreads.map((thread) => (
												<ThreadItem
													key={thread.id}
													thread={thread}
													isSelected={
														thread.id ===
														selectedThreadId
													}
													onClick={() =>
														onThreadSelect(
															thread.id
														)
													}
												/>
											))}
										</div>
									)
								)}
							</div>
						)}
					</div>
				)
			})}
		</div>
	)
}
