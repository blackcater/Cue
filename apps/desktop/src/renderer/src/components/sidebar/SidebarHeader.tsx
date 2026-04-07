import { cn } from '@acme-ai/ui'
import { Button } from '@acme-ai/ui/foundation'
import {
	ChatAddIcon,
	Clock01Icon,
	DashboardSquare01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, useParams } from '@tanstack/react-router'

interface SidebarHeaderProps {
	collapsed?: boolean
}

export function SidebarHeader({ collapsed }: SidebarHeaderProps = {}) {
	const { vaultId } = useParams({ from: '/vault/$vaultId' })

	if (collapsed) {
		return (
			<div className="mb-2 flex w-full flex-col items-center gap-2 pt-1">
				<Button variant="pure" size="icon" asChild>
					<Link to="/vault/$vaultId" params={{ vaultId }}>
						<HugeiconsIcon icon={ChatAddIcon} />
					</Link>
				</Button>
				<Button variant="pure" size="icon" asChild>
					<Link
						to="/vault/$vaultId/extensions"
						params={{ vaultId }}
						activeOptions={{ exact: true }}
						activeProps={{ className: 'bg-hover' }}
					>
						<HugeiconsIcon icon={DashboardSquare01Icon} />
					</Link>
				</Button>
				<Button variant="pure" size="icon" asChild>
					<Link
						to="/vault/$vaultId/automations"
						params={{ vaultId }}
						activeOptions={{ exact: true }}
						activeProps={{ className: 'bg-hover' }}
					>
						<HugeiconsIcon icon={Clock01Icon} />
					</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className="mb-2 flex w-full flex-col items-start gap-2">
			<section className="w-full px-2">
				<Button
					className="w-full justify-start"
					variant="pure"
					size="lg"
					asChild
				>
					<Link to="/vault/$vaultId" params={{ vaultId }}>
						<HugeiconsIcon icon={ChatAddIcon} className="mr-1" />
						New Thread
					</Link>
				</Button>
				<Button
					className={cn('w-full justify-start')}
					variant="pure"
					size="lg"
					asChild
				>
					<Link
						to="/vault/$vaultId/extensions"
						params={{ vaultId }}
						activeOptions={{ exact: true }}
						activeProps={{ className: 'bg-hover' }}
					>
						<HugeiconsIcon
							icon={DashboardSquare01Icon}
							className="mr-1"
						/>
						Extensions
					</Link>
				</Button>
				<Button
					className="w-full justify-start"
					variant="pure"
					size="lg"
					asChild
				>
					<Link
						to="/vault/$vaultId/automations"
						params={{ vaultId }}
						activeOptions={{ exact: true }}
						activeProps={{ className: 'bg-hover' }}
					>
						<HugeiconsIcon icon={Clock01Icon} className="mr-1" />
						Automations
					</Link>
				</Button>
			</section>
		</div>
	)
}
