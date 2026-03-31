import { useAtom, useAtomValue } from 'jotai'
import { FolderCell } from '../cell/FolderCell'
import { ThreadCell } from '../cell/ThreadCell'
import { TitleCell } from '../cell/TitleCell'
import { foldersAtom, threadsAtom, openFoldersAtom, viewModeAtom } from '../atoms/thread-atoms'

export function FolderView() {
  const [, setViewMode] = useAtom(viewModeAtom)
  const [openFolders, setOpenFolders] = useAtom(openFoldersAtom)
  const folders = useAtomValue(foldersAtom)
  const threads = useAtomValue(threadsAtom)

  const handleToggleFolder = (folderId: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handleSort = () => {
    setViewMode('flat')
  }

  const handleAddFolder = () => {
    // TODO: implement folder creation
  }

  // Group threads by folder
  const unfolderedThreads = threads.filter((t) => !t.folderId && !t.isPinned)
  const folderContents = folders.map((folder) => ({
    folder,
    threads: threads.filter((t) => t.folderId === folder.id),
  }))

  return (
    <section className="flex flex-col gap-1 px-2">
      <TitleCell
        title="Threads"
        onSort={handleSort}
        onAdd={handleAddFolder}
      />
      <div className="flex flex-col gap-0.5">
        {/* Unfoldered threads */}
        {unfolderedThreads.map((thread) => (
          <ThreadCell key={thread.id} thread={thread} />
        ))}

        {/* Folders with their threads */}
        {folderContents.map(({ folder, threads: folderThreads }) => {
          const isOpen = openFolders.has(folder.id)
          return (
            <div key={folder.id} className="flex flex-col gap-0.5">
              <FolderCell
                id={folder.id}
                title={folder.title}
                isExpanded={isOpen}
                onToggle={handleToggleFolder}
                onAddThread={(_folderId) => {
                  // TODO: implement add thread to folder
                }}
              />
              {isOpen && (
                <div className="ml-4 flex flex-col gap-0.5">
                  {folderThreads.map((thread) => (
                    <ThreadCell key={thread.id} thread={thread} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
