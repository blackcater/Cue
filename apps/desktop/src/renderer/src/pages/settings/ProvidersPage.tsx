import { Button } from '@acme-ai/ui/foundation'

import { SettingsContent } from '../../components/settings/SettingsContent'
import { SettingsSection } from '../../components/settings/SettingsSection'

export function ProvidersPage() {
	return (
		<SettingsContent>
			<SettingsSection
				title="Providers"
				description="Configure model providers and API keys"
			>
				<div className="text-muted-foreground mb-4 text-sm">
					No providers configured yet.
				</div>
				<Button>Add Provider</Button>
			</SettingsSection>
		</SettingsContent>
	)
}
