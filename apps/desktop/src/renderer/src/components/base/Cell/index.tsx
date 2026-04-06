import React from 'react'

import { cn } from '@acme-ai/ui'

export interface CellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Cell({ className, children, ...props }: Readonly<CellProps>) {
	return (
		<div
			className={cn(
				'group text-secondary-foreground flex h-8 items-center gap-1 overflow-hidden rounded-md px-2.5 text-sm transition-colors',
				className
			)}
			{...props}
		>
			{children}
		</div>
	)
}

export interface CellIconProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CellIcon({
	className,
	children,
	...props
}: Readonly<CellIconProps>) {
	return (
		<div
			className={cn(
				'relative mr-1.5 flex shrink-0 items-center justify-start',
				className
			)}
			{...props}
		>
			{children}
		</div>
	)
}

export interface CellNameProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function CellName({
	className,
	children,
	...props
}: Readonly<CellNameProps>) {
	return (
		<span className={cn('flex-1 truncate text-xs', className)} {...props}>
			{children}
		</span>
	)
}

export interface CellActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CellActions({
	className,
	children,
	...props
}: Readonly<CellActionsProps>) {
	return (
		<div
			className={cn(
				'flex shrink-0 items-center gap-1 transition-opacity',
				className
			)}
			{...props}
		>
			{children}
		</div>
	)
}
