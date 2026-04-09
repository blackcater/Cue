import { browserApi } from '@renderer/api'

export function NewBrowserButton() {
	const handleCreateBrowser = async () => {
		await browserApi.create()
	}

	return (
		<button
			onClick={handleCreateBrowser}
			className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center rounded-md py-1.5 text-xs font-medium"
		>
			New Browser Window
		</button>
	)
}
