export interface FileNode {
	name: string
	path: string
	type: 'file' | 'directory'
	extension?: string
	children?: FileNode[]
}

export interface FileOperationCallbacks {
	onOpenInEditor?: (node: FileNode) => void
	onNewFile?: (node: FileNode) => void
	onNewFolder?: (node: FileNode) => void
	onCopyPath?: (node: FileNode) => void
	onShowInFinder?: (node: FileNode) => void
	onRename?: (node: FileNode) => void
	onMoveToTrash?: (node: FileNode) => void
}
