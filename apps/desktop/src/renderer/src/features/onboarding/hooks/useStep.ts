import { useCallback, useState } from 'react'

export function useStep(stepCount: number, initialStep: number) {
	const [step, setStep] = useState(initialStep)

	const nextStep = useCallback(() => {
		if (step >= stepCount - 1) {
			return
		}
		setStep((prevStep) => prevStep + 1)
	}, [step, stepCount])

	const prevStep = useCallback(() => {
		if (step <= 0) {
			return
		}
		setStep((prevStep) => prevStep - 1)
	}, [step])

	return {
		step,
		setStep,
		nextStep,
		prevStep,
	}
}
