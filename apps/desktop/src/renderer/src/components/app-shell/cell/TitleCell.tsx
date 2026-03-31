import { Add01Icon, SortByUp02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@acme-ai/ui/foundation'

import { Cell, CellName, CellActions } from './Cell'
import { cn } from '@acme-ai/ui/lib/utils'

export interface TitleCellProps {
  title: string
  onSort?: () => void
  onAdd?: () => void
  className?: string
}

export function TitleCell({
  title,
  onSort,
  onAdd,
  className,
}: TitleCellProps) {
  return (
    <Cell className={cn('text-muted-foreground cursor-default hover:bg-transparent', className)}>
      <CellName className="text-xs font-semibold uppercase tracking-wider">
        {title}
      </CellName>
      <CellActions>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation()
            onSort?.()
          }}
          className="h-6 w-6"
          aria-label="Sort"
        >
          <HugeiconsIcon icon={SortByUp02Icon} className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation()
            onAdd?.()
          }}
          className="h-6 w-6"
          aria-label="Add"
        >
          <HugeiconsIcon icon={Add01Icon} className="h-3 w-3" />
        </Button>
      </CellActions>
    </Cell>
  )
}
