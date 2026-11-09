import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useDashboard } from '@/context/DashboardContext'
import { isMacApp } from '@/lib/macApp'
import { backupName, backupText, BackupFormatError, describe, itemCount, parseBackup, readSnapshots, restore, type Snapshot } from '@/sync/backup'
import type { SyncDoc } from '@/sync/merge'
import { readLocalDoc } from '@/sync/store'
import { FormGroup } from './fields'

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const reasonLabel: Record<Snapshot['reason'], string> = {
  daily: 'Daily copy',
  'before-delete': 'Before Delete all data',
  'before-restore': 'Before a restore',
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

/**
 * Settings → Data: back up everything to a file, restore from a file or from the copies kept on this device,
 * and delete everything (which syncs to every device, so a copy is kept first).
 */
export function DataSection({ onDone }: { onDone: () => void }) {
  const { clearAll, notify, calendar } = useDashboard()
  const fileInput = useRef<HTMLInputElement>(null)
  const [snapshots, setSnapshots] = useState(readSnapshots)
  const synced = Boolean(calendar.google.account)

  const exportBackup = async () => {
    const text = backupText()
    const name = backupName()
    const file = new File([text], name, { type: 'application/json' })
    try {
      // iPhone and Safari: the share sheet, with "Save to Files".
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name })
        return
      }
      // The Mac app's window can't download files; the clipboard always works there.
      if (isMacApp || !('download' in HTMLAnchorElement.prototype)) {
        await copyText(text)
        notify('Backup copied. Paste it into a note or a text file and keep it somewhere safe.')
        return
      }
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      notify(`Saved ${name} to your downloads`)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      try {
        await copyText(text)
        notify('Backup copied. Paste it into a note or a text file and keep it somewhere safe.')
      } catch {
        notify('Couldn’t save the backup on this device. Try from the website in Safari or Chrome.', 'error')
      }
    }
  }

  const restoreDoc = (doc: SyncDoc, from: string) => {
    const local = readLocalDoc()
    const ids = new Map(Object.entries(local.collections).map(([k, list]) => [k, new Set(list.map((r) => r.id))]))
    const missing = Object.entries(doc.collections).reduce((n, [k, list]) => n + list.filter((r) => !ids.get(k)?.has(r.id)).length, 0)
    if (missing === 0) {
      notify(`Nothing to restore: everything in ${from} is already here.`)
      return
    }
    const ok = confirm(
      `${from} has ${describe(doc)}.\n\n${missing} ${missing === 1 ? 'item isn’t' : 'items aren’t'} on this device and will be added back${synced ? ' (and synced to your other devices)' : ''}. Nothing here is deleted or changed.`,
    )
    if (!ok) return
    const added = restore(doc)
    setSnapshots(readSnapshots())
    notify(`Restored ${added} ${added === 1 ? 'item' : 'items'}`)
  }

  const restoreText = (text: string, from: string) => {
    try {
      restoreDoc(parseBackup(text).doc, from)
    } catch (e) {
      notify(e instanceof BackupFormatError ? e.message : 'Couldn’t read that backup.', 'error')
    }
  }

  const deleteAll = () => {
    const where = synced ? 'on this device and on every device signed in to your Google account' : 'on this device'
    if (!confirm(`Delete all courses, deadlines, events, tasks and exam results ${where}?\n\nA copy is kept on this device, so you can bring it back from Settings → Data.`))
      return
    clearAll()
    setSnapshots(readSnapshots())
    notify('All data deleted. A copy is kept under Settings → Data.')
    onDone()
  }

  const here = readLocalDoc()

  return (
    <FormGroup
      title="Data"
      footer={
        synced
          ? 'Your data is on this device and in a private folder in your Google Drive, and syncs to every device signed in to it. dash also keeps a copy on this device once a day (the last 7).'
          : 'Your data is stored on this device only. dash keeps a copy here once a day (the last 7). Sign in with Google to sync it to your other devices.'
      }
    >
      <p className="px-1 text-subhead text-muted">On this device: {describe(here)}.</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={exportBackup} disabled={itemCount(here) === 0}>
          Export backup
        </Button>
        <Button size="sm" onClick={() => fileInput.current?.click()}>
          Restore from file
        </Button>
        <Button
          size="sm"
          variant="plain"
          onClick={async () => {
            try {
              restoreText(await navigator.clipboard.readText(), 'The copied backup')
            } catch {
              notify('Couldn’t read the clipboard. Copy the backup text first.', 'error')
            }
          }}
        >
          Restore copied backup
        </Button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json,text/plain"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) restoreText(await f.text(), 'That backup')
        }}
      />

      {snapshots.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="px-1 text-subhead font-medium text-muted">Copies on this device</span>
          <ul className="surface separated">
            {snapshots.map((s) => (
              <li key={s.createdAt} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-body text-ink">
                    {when(s.createdAt)} · {reasonLabel[s.reason]}
                  </span>
                  <span className="block truncate text-subhead text-muted">{describe(s.doc)}</span>
                </span>
                <Button size="sm" onClick={() => restoreDoc(s.doc, `The copy from ${when(s.createdAt)}`)}>
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button size="sm" variant="danger" className="self-start" onClick={deleteAll}>
        Delete all data
      </Button>
    </FormGroup>
  )
}
