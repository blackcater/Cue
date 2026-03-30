import type { FC } from 'react'

interface Props {
	onFinish: () => void
}

export const ReadyStep: FC<Props> = ({ onFinish }) => {
	return (
		<div className="flex h-full flex-col items-center justify-center text-center">
			<h1 className="mb-4 text-3xl font-bold">You're All Set!</h1>
			<p className="text-muted-foreground mb-8 max-w-md">
				Everything is configured and ready to go. Start building with
				Acme.
			</p>
			<button
				onClick={onFinish}
				className="bg-primary text-primary-foreground rounded-lg px-6 py-3 font-medium"
			>
				Finish
			</button>
		</div>
	)
}
