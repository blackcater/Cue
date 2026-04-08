import type { ImgHTMLAttributes } from 'react'

import * as assets from './assets'
import iconsJson from './icons.json'

// Tool configuration from icons.json
interface ToolConfig {
	id: string
	displayName: string
	icon: string
	commands: string[]
}

// Read tools from icons.json
const toolConfigs: ToolConfig[] = iconsJson.tools

// Build lookup maps
const commandToTool = new Map<string, ToolConfig>()

for (const tool of toolConfigs) {
	for (const cmd of tool.commands) {
		commandToTool.set(cmd, tool)
	}
}

// Map icon filename to asset key
function iconFilenameToAssetKey(filename: string): string | null {
	// Remove extension
	const baseName = filename.replace(/\.(ico|png|jpg|svg)$/i, '')
	return baseName
}

export interface ToolProps extends Omit<
	ImgHTMLAttributes<HTMLImageElement>,
	'src'
> {
	/** Command name to match (e.g., 'git', 'npm', 'docker') */
	command?: string
	/** Tool id to match directly (e.g., 'git', 'npm', 'docker') */
	tool?: string
	/** Fallback icon when no match found */
	defaultIcon?: React.ReactNode
}

export function Tool({
	command,
	tool,
	defaultIcon,
	className,
	...props
}: Readonly<ToolProps>) {
	// Find tool config by command or tool id
	let toolConfig: ToolConfig | undefined

	if (command) {
		toolConfig = commandToTool.get(command)
	}

	if (!toolConfig && tool) {
		toolConfig = toolConfigs.find((t) => t.id === tool)
	}

	if (!toolConfig) {
		return defaultIcon ? <>{defaultIcon}</> : null
	}

	// Get asset key from icon filename
	const assetKey = iconFilenameToAssetKey(toolConfig.icon)
	if (!assetKey) {
		return defaultIcon ? <>{defaultIcon}</> : null
	}

	const iconSrc = assets[assetKey as keyof typeof assets]
	if (!iconSrc) {
		return defaultIcon ? <>{defaultIcon}</> : null
	}

	return (
		<img
			src={iconSrc}
			alt={toolConfig.displayName}
			className={className}
			style={{ width: '16px', height: '16px' }}
			{...props}
		/>
	)
}
