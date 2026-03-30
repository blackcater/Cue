import type { FC } from 'react'

interface Props {
	onNext: () => void
}

export const WelcomeStep: FC<Props> = ({ onNext }) => {
	return (
		<div className="flex h-full flex-col items-center justify-center text-center">
			<h1 className="mb-4 text-3xl font-bold">Welcome to Acme</h1>
			<p className="text-muted-foreground mb-8 max-w-md">
				Your AI-powered development environment. Let's get you set up in
				a few steps.
			</p>
			<button
				onClick={onNext}
				className="bg-primary text-primary-foreground rounded-lg px-6 py-3 font-medium"
			>
				Get Started
			</button>
		</div>
	)
}
