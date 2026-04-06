import { useAtom } from 'jotai'

import { panelAtom } from '@renderer/stores'
import type { PanelType } from '@renderer/types/panel'

/**
 * Hook to manage chat panel state
 */
export function useChatPanel() {
	const [panelState, setPanelState] = useAtom(panelAtom)

	function setPanelType(type: PanelType) {
		setPanelState((prev) => ({ ...prev, type }))
	}

	function toggleCollapsed() {
		setPanelState((prev) => ({ ...prev, collapsed: !prev.collapsed }))
	}

	function setWidth(width: number) {
		setPanelState((prev) => ({ ...prev, width }))
	}

	return {
		panelState,
		setPanelType,
		toggleCollapsed,
		setWidth,
	}
}
