import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useDashboard } from '@/context/DashboardContext'
import { searchPlace } from '@/data/weather'
import { parseIcs } from '@/lib/ics'
import { Field, TextInput } from './fields'

export function SettingsForm({ onDone }: { onDone: () => void }) {
  const { profile, setProfile, events, courses, loadSample, clearAll } = useDashboard()
  const [name, setName] = useState(profile.name)
  const [city, setCity] = useState(profile.place?.name ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const trimmed = city.trim()
      let place = profile.place
      if (!trimmed) place = undefined
      else if (trimmed !== profile.place?.name) {
        const found = await searchPlace(trimmed)
        if (!found) {
          setMessage(`No place called “${trimmed}” was found. Check the spelling or try a nearby city.`)
          return
        }
        place = found
      }
      setProfile({ name: name.trim(), place })
      onDone()
    } catch {
      setMessage('Couldn’t reach the location service. Check your connection and save again.')
    } finally {
      setBusy(false)
    }
  }

  const importIcs = async (file: File) => {
    const imported = parseIcs(await file.text())
    if (imported.length === 0) {
      setMessage('No upcoming events were found in that file.')
      return
    }
    const ids = new Set(imported.map((e) => e.id))
    events.set((list) => [...list.filter((e) => !ids.has(e.id)), ...imported])
    setMessage(`Imported ${imported.length} ${imported.length === 1 ? 'event' : 'events'}.`)
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={save} className="flex flex-col gap-4">
        <Field label="Your name" hint="Used in the greeting.">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
        </Field>
        <Field label="Weather location" hint="Leave empty to use this device’s location.">
          <TextInput value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" autoComplete="address-level2" />
        </Field>
        <Button type="submit" variant="primary" disabled={busy} className="self-end">
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </form>

      {message && (
        <p role="status" className="rounded-xl bg-accent/10 px-3 py-2 text-sm text-accent">
          {message}
        </p>
      )}

      <section className="flex flex-col gap-3 border-t border-line pt-5">
        <h3 className="text-sm font-medium text-ink">Calendar import</h3>
        <p className="text-sm text-muted">
          Import an .ics file from Google Calendar, Apple Calendar or your school portal. Importing the same file
          again updates those events instead of duplicating them.
        </p>
        <input
          ref={fileInput}
          type="file"
          accept=".ics,text/calendar"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importIcs(f)
            e.target.value = ''
          }}
        />
        <Button onClick={() => fileInput.current?.click()} className="self-start">
          Choose .ics file
        </Button>
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-5">
        <h3 className="text-sm font-medium text-ink">Data</h3>
        <p className="text-sm text-muted">Everything is stored on this device only.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              if (courses.items.length && !confirm('Replace your courses, deadlines, events and tasks with sample data?')) return
              loadSample()
              onDone()
            }}
          >
            Load sample data
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!confirm('Delete all courses, deadlines, events and tasks on this device?')) return
              clearAll()
              onDone()
            }}
          >
            Delete all data
          </Button>
        </div>
      </section>
    </div>
  )
}
