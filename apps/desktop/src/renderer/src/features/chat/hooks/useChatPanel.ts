import { useCallback } from 'react'

import { useAtom } from 'jotai'

import { panelAtom } from '@renderer/stores'
import type { PanelType } from '@renderer/types/panel'

/**
 * Hook to manage chat panel state
 */
export function useChatPanel() {
	const [panelState, setPanelState] = useAtom(panelAtom)

	const setPanelType = useCallback(
		(type: PanelType) => {
			setPanelState((prev) => ({ ...prev, type }))
		},
		[setPanelState]
	)

	const toggleCollapsed = useCallback(() => {
		setPanelState((prev) => ({ ...prev, collapsed: !prev.collapsed }))
	}, [setPanelState])

	const setPanelWidth = useCallback(
		(width: number) => {
			setPanelState((prev) => ({ ...prev, width }))
		},
		[setPanelState]
	)

	return {
		panelState,
		isCollapsed: panelState.collapsed,
		toggleCollapsed,
		setPanelType,
		setPanelWidth,
	}
}
