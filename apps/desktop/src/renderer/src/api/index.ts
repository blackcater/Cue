/**
 * Typed API facade for renderer process
 * Exposes gitApi and browserApi from window.api with full type safety
 */

import type { BrowserHandler } from '@main/handlers/browser'
import type { GitHandler } from '@main/handlers/git'

/**
 * Git API facade with typed methods
 * Calls are forwarded to main process via IPC
 */
export const gitApi = {
	status: (repoPath: string) => window.api.git.status(repoPath),
	branches: (repoPath: string) => window.api.git.branches(repoPath),
	currentBranch: (repoPath: string) => window.api.git.currentBranch(repoPath),
	log: (repoPath: string, count?: number) =>
		window.api.git.log(repoPath, count),
	diffStat: (repoPath: string) => window.api.git.diffStat(repoPath),
	stage: (repoPath: string, files: string[]) =>
		window.api.git.stage(repoPath, files),
	unstage: (repoPath: string, files: string[]) =>
		window.api.git.unstage(repoPath, files),
	stageAll: (repoPath: string) => window.api.git.stageAll(repoPath),
	unstageAll: (repoPath: string) => window.api.git.unstageAll(repoPath),
	discard: (repoPath: string, files: string[]) =>
		window.api.git.discard(repoPath, files),
	commit: (repoPath: string, message: string) =>
		window.api.git.commit(repoPath, message),
	checkout: (repoPath: string, branch: string) =>
		window.api.git.checkout(repoPath, branch),
	createBranch: (repoPath: string, name: string) =>
		window.api.git.createBranch(repoPath, name),
	push: (repoPath: string) => window.api.git.push(repoPath),
	pull: (repoPath: string) => window.api.git.pull(repoPath),
	fetch: (repoPath: string) => window.api.git.fetch(repoPath),
	generateCommitMessage: (repoPath: string) =>
		window.api.git.generateCommitMessage(repoPath),
} satisfies Pick<GitHandler, keyof GitHandler>

/**
 * Browser API facade with typed methods
 * Calls are forwarded to main process via IPC
 */
export const browserApi = {
	create: (url?: string, options?: { width?: number; height?: number }) =>
		window.api.browser.create(url, options),
	destroy: (id: string) => window.api.browser.destroy(id),
	list: () => window.api.browser.list(),
	navigate: (id: string, url: string) => window.api.browser.navigate(id, url),
	goBack: (id: string) => window.api.browser.goBack(id),
	goForward: (id: string) => window.api.browser.goForward(id),
	reload: (id: string) => window.api.browser.reload(id),
	stop: (id: string) => window.api.browser.stop(id),
	focus: (id: string) => window.api.browser.focus(id),
	screenshot: (id: string) => window.api.browser.screenshot(id),
	getAccessibilitySnapshot: (id: string) =>
		window.api.browser.getAccessibilitySnapshot(id),
	clickElement: (id: string, selector: string) =>
		window.api.browser.clickElement(id, selector),
	fillElement: (id: string, selector: string, value: string) =>
		window.api.browser.fillElement(id, selector, value),
	selectOption: (id: string, selector: string, value: string) =>
		window.api.browser.selectOption(id, selector, value),
} satisfies Pick<BrowserHandler, keyof BrowserHandler>
