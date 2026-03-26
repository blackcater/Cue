import { useNavigate } from '@tanstack/react-router'

export function HomePage() {
	const navigate = useNavigate()

	return (
		<div>
			<h1>主页面</h1>
			<p>欢迎来到主页</p>
			<button
				type="button"
				onClick={() => navigate({ to: '/rpc-debug' })}
			>
				RPC Debug
			</button>
		</div>
	)
}
