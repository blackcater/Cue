import { NavigationButtons } from './NavigationButtons'

export function AppHeader(): React.JSX.Element {
  return (
    <div className="flex h-10 w-full shrink-0 items-center border-b border-border bg-sidebar px-4 gap-2">
      <NavigationButtons />
    </div>
  )
}
