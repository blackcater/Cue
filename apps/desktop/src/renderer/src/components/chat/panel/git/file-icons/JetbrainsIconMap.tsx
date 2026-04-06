import type { FileNodeData } from '../types'

interface IconDefinition {
	iconPath: string
}

interface IconTheme {
	iconDefinitions: Record<string, IconDefinition>
	fileNames: Record<string, string>
	fileExtensions: Record<string, string>
	folderNames: Record<string, string>
	folder: string
	file: string
}

// Pre-load icon URLs using Vite's glob import
// This gives us actual URLs like /assets/icons/file/typeScript_dark.svg?v=xxx
const darkFileIcons = import.meta.glob(
	'./src/renderer/src/assets/icons/file/*_dark.svg',
	{
		query: '?url',
		import: 'default',
		eager: true,
	}
) as Record<string, string>

const lightFileIcons = import.meta.glob(
	'./src/renderer/src/assets/icons/file/*_light.svg',
	{
		query: '?url',
		import: 'default',
		eager: true,
	}
) as Record<string, string>

const darkFolderIcons = import.meta.glob(
	'./src/renderer/src/assets/icons/folder/*_dark.svg',
	{
		query: '?url',
		import: 'default',
		eager: true,
	}
) as Record<string, string>

const lightFolderIcons = import.meta.glob(
	'./src/renderer/src/assets/icons/folder/*_light.svg',
	{
		query: '?url',
		import: 'default',
		eager: true,
	}
) as Record<string, string>

// Build reverse lookup: filename without extension -> URL
// e.g., "typeScript_dark" -> "/assets/icons/file/typeScript_dark.svg?v=xxx"
function buildFilenameToUrlMap(
	icons: Record<string, string>
): Record<string, string> {
	const result: Record<string, string> = {}
	for (const [fullPath, url] of Object.entries(icons)) {
		// fullPath looks like: /src/renderer/src/assets/icons/file/typeScript_dark.svg
		// Extract "typeScript_dark" from the path
		const fileName = fullPath.split('/').pop()?.replace('.svg', '') ?? ''
		result[fileName] = url
	}
	return result
}

const darkFileIconUrls = buildFilenameToUrlMap(darkFileIcons)
const lightFileIconUrls = buildFilenameToUrlMap(lightFileIcons)
const darkFolderIconUrls = buildFilenameToUrlMap(darkFolderIcons)
const lightFolderIconUrls = buildFilenameToUrlMap(lightFolderIcons)

// Load themes
let darkTheme: IconTheme | null = null
let lightTheme: IconTheme | null = null
let themesLoaded = false

export async function loadIconThemes(): Promise<void> {
	if (themesLoaded) return

	const [dark, light] = await Promise.all([
		import('@renderer/assets/dark-jetbrains-icon-theme.json'),
		import('@renderer/assets/light-jetbrains-icon-theme.json'),
	])
	darkTheme = dark.default
	lightTheme = light.default
	themesLoaded = true
}

export function getIconUrl(
	node: FileNodeData,
	theme: 'dark' | 'light'
): string | null {
	const iconMap = theme === 'dark' ? darkTheme : lightTheme
	if (!iconMap) return null

	let iconKey: string | undefined

	// 1. Check fileNames (exact match for special files like .gitignore, Dockerfile)
	if (iconMap.fileNames[node.name]) {
		iconKey = iconMap.fileNames[node.name]
	} else if (node.type === 'directory' && iconMap.folderNames[node.name]) {
		// 2. Check folderNames (for directories like src, lib, test)
		iconKey = iconMap.folderNames[node.name]
	} else if (node.extension && iconMap.fileExtensions[node.extension]) {
		// 3. Check fileExtensions (for regular files like .ts, .tsx, .json)
		iconKey = iconMap.fileExtensions[node.extension]
	} else {
		// 4. Default icon
		iconKey = node.type === 'directory' ? iconMap.folder : iconMap.file
	}

	if (!iconKey) return null

	// Get the icon definition to find the iconPath
	const iconDef = iconMap.iconDefinitions[iconKey]
	if (!iconDef) return null

	// iconPath looks like: "./icons/file/typeScript_dark.svg"
	// We need to extract the filename without extension: "typeScript_dark"
	const iconFilename = iconDef.iconPath
		.replace('./icons/file/', '')
		.replace('./icons/folder/', '')
		.replace('.svg', '')

	// Look up the URL using the filename
	const fileIconUrls = theme === 'dark' ? darkFileIconUrls : lightFileIconUrls
	const folderIconUrls =
		theme === 'dark' ? darkFolderIconUrls : lightFolderIconUrls

	const iconUrls = node.type === 'directory' ? folderIconUrls : fileIconUrls
	return iconUrls[iconFilename] ?? null
}
