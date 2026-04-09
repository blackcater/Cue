import { useEffect, useRef, useState } from 'react'

import { File01Icon, Folder01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

export interface InlineCreateInputProps {
	depth: number
	type: 'file' | 'folder'
	onCommit: (name: string) => void
	onCancel: () => void
}

export function InlineCreateInput({
	depth,
	type,
	onCommit,
	onCancel,
}: InlineCreateInputProps) {
	const [value, setValue] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		inputRef.current?.focus()
	}, [])

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			e.stopPropagation()
			if (value.trim()) {
				onCommit(value.trim())
			} else {
				onCancel()
			}
		} else if (e.key === 'Escape') {
			e.preventDefault()
			e.stopPropagation()
			onCancel()
		}
	}

	const handleBlur = () => {
		if (value.trim()) {
			onCommit(value.trim())
		} else {
			onCancel()
		}
	}

	const paddingLeft = depth * 16 + 8

	return (
		<div
			className="flex h-7 items-center gap-1 px-2 hover:bg-black/5 dark:hover:bg-white/5"
			style={{ paddingLeft }}
		>
			<HugeiconsIcon
				icon={type === 'file' ? File01Icon : Folder01Icon}
				className="text-muted-foreground size-3.5 shrink-0"
			/>
			<input
				ref={inputRef}
				type="text"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
				onClick={(e) => e.stopPropagation()}
				placeholder={`New ${type} name...`}
				className="w-full border-none bg-transparent text-xs outline-none"
			/>
		</div>
	)
}
