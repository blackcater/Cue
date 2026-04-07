import type React from 'react'

import { cn } from '@acme-ai/ui'

import { Cell, CellName, CellActions } from './Cell'

export interface TitleCellProps {
	title: string
	className?: string
	children?: React.ReactNode
}

export function TitleCell({
	title,
	className,
	children,
}: Readonly<TitleCellProps>) {
	return (
		<Cell className={cn('cursor-default', className)}>
			<CellName className="text-muted-foreground font-semibold tracking-wider select-none">
				{title}
			</CellName>
			<CellActions>{children}</CellActions>
		</Cell>
	)
}
