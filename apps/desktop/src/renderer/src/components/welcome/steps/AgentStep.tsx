import type { FC } from 'react'

interface Props {
	onNext: () => void
}

export const AgentStep: FC<Props> = ({ onNext }) => {
	return (
		<div className="flex h-full flex-col items-center justify-center text-center">
			<h1 className="mb-4 text-3xl font-bold">Configure Your Agent</h1>
			<p className="text-muted-foreground mb-8 max-w-md">
				Set up your AI agent preferences. This step is under
				construction.
			</p>
			<button
				onClick={onNext}
				className="bg-primary text-primary-foreground rounded-lg px-6 py-3 font-medium"
			>
				Next
			</button>
		</div>
	)
}
