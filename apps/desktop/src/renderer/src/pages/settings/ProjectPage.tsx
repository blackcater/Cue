import {
	Button,
	Input,
	Label,
	Separator,
	Textarea,
} from '@acme-ai/ui/foundation'

import { SettingsContent } from '../../components/settings/SettingsContent'
import { SettingsSection } from '../../components/settings/SettingsSection'

export interface ProjectPageProps {
	projectId: string
}

export function ProjectPage({ projectId }: Readonly<ProjectPageProps>) {
	return (
		<SettingsContent>
			<SettingsSection
				title="Project Settings"
				description={`Configure settings for project ${projectId}`}
			>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							Project Name
						</Label>
						<Input placeholder="Project name" />
					</div>
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							Description
						</Label>
						<Textarea placeholder="Project description" />
					</div>
					<Separator />
					<Button variant="destructive">Archive Project</Button>
				</div>
			</SettingsSection>
		</SettingsContent>
	)
}
