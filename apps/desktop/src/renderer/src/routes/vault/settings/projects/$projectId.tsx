import { createFileRoute } from '@tanstack/react-router'

import { ProjectPage } from '@renderer/pages/settings/ProjectPage'

export const Route = createFileRoute('/vault/settings/projects/$projectId')({
	component: ProjectSettingsPage,
})

function ProjectSettingsPage() {
	const { projectId } = Route.useParams()

	return <ProjectPage projectId={projectId} />
}
