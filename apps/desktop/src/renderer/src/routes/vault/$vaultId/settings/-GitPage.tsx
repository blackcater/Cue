import React from 'react'

import { Switch } from '@acme-ai/ui/foundation'
import { Label } from '@acme-ai/ui/foundation'

import {
	SettingsContent,
	SettingsSection,
} from '@renderer/components/settings/SettingsContent'

export function GitPage(): React.JSX.Element {
	const [deleteLocalBranch, setDeleteLocalBranch] = React.useState(false)

	return (
		<SettingsContent>
			<SettingsSection
				title="Git & Worktrees"
				description="Configure git branch and worktree behavior"
			>
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<Label
							htmlFor="delete-local-branch"
							className="text-sm font-medium"
						>
							Delete Local Branch on Removal
						</Label>
						<p className="text-muted-foreground text-xs">
							Delete git branch when deleting a worktree
						</p>
					</div>
					<Switch
						id="delete-local-branch"
						checked={deleteLocalBranch}
						onCheckedChange={setDeleteLocalBranch}
					/>
				</div>
			</SettingsSection>
		</SettingsContent>
	)
}
