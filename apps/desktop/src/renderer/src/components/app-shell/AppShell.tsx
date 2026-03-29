import { cn } from '@acme-ai/ui/lib/utils'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { isElectron } from '../../lib/electron'

interface AppShellProps {
  children: React.ReactNode
  enableBlur?: boolean
  enableNoise?: boolean
}

export function AppShell({
  children,
  enableBlur = false,
  enableNoise = false,
}: AppShellProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex h-screen flex-col bg-background',
        isElectron && enableBlur && 'backdrop-blur-xl',
        isElectron && enableNoise && 'bg-noise'
      )}
    >
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
