import {
	Button,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@acme-ai/ui/foundation'
import {
	Bug02Icon,
	CodeSimpleIcon,
	Settings05Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useNavigate } from '@tanstack/react-router'

export function SidebarFooter() {
	const navigate = useNavigate()

	return (
		<div className="flex w-full flex-col">
			<div className="text-muted-foreground flex flex-row items-center justify-center text-xs">
				<Button className="text-muted-foreground" variant="link">
					Acme is in beta
				</Button>
				<span>·</span>
				<Button className="text-muted-foreground" variant="link">
					<HugeiconsIcon icon={Bug02Icon} />
					Report a bug
				</Button>
			</div>
			<div className="flex flex-row items-center">
				<div className="flex-1">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="h-10 w-full justify-start text-xs/relaxed"
								variant="pure"
								size="lg"
								aria-label="Select or create vault"
							>
								<HugeiconsIcon
									icon={CodeSimpleIcon}
									className="rotate-90 transform"
								/>
								Default Vault
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-fit" alignOffset={10}>
							<DropdownMenuCheckboxItem checked>
								Default Vault
							</DropdownMenuCheckboxItem>
							<DropdownMenuItem>Bar Vault</DropdownMenuItem>
							<DropdownMenuItem>Foo Vault</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								Create New Vault
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div>
					<Button
						variant="pure"
						size="icon-xl"
						aria-label="Settings"
						onClick={() => navigate({ to: '/vault/settings' })}
					>
						<HugeiconsIcon icon={Settings05Icon} />
					</Button>
				</div>
			</div>
		</div>
	)
}
