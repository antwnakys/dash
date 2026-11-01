import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useDashboard } from '@/context/DashboardContext'
import { currentPosition, searchPlace } from '@/data/weather'
import { countdown } from '@/lib/date'
import { parseIcs } from '@/lib/ics'
import { Field, TextInput } from './fields'

const isCalendarUrl = (u: string) => /^(https?|webcal):\/\/\S+/i.test(u.trim())

export function SettingsForm({ onDone, section }: { onDone: () => void; section?: 'calendar' }) {
  const { profile, setProfile, events, courses, calendar, loadSample, clearAll } = useDashboard()
  const [calendarText, setCalendarText] = useState((profile.calendarUrls ?? []).join('\n'))
  const [name, setName] = useState(profile.name)
  const [city, setCity] = useState(profile.place?.name ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const calendarSection = useRef<HTMLElement>(null)

  useEffect(() => {
    if (section === 'calendar') calendarSection.current?.scrollIntoView({ block: 'start' })
  }, [section])

  const connect = (text: string) => {
    const urls = text.split(/\s+/).filter(isCalendarUrl)
    setProfile({ calendarUrls: urls })
    setCalendarText(urls.join('\n'))
  }

  const pasteAndConnect = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim()
      if (!isCalendarUrl(text)) {
        setMessage('The clipboard doesn’t hold a calendar link. Copy the “Secret address in iCal format” first.')
        return
      }
      connect([calendarText, text].filter(Boolean).join('\n'))
    } catch {
      setMessage('Couldn’t read the clipboard. Long-press the box below and choose Paste instead.')
    }
  }

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
        <Field label="Weather location">
          <TextInput value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" autoComplete="address-level2" />
        </Field>
        <button
          type="button"
          onClick={async () => {
            try {
              const here = await currentPosition()
              const place = { ...here, name: 'Current location' }
              setProfile({ place })
              setCity(place.name)
              setMessage('Weather now follows your current location.')
            } catch {
              setMessage('Location access is off. Allow it for dash in iPhone Settings, or type a city instead.')
            }
          }}
          className="-mt-2 self-start text-sm text-accent hover:underline"
        >
          Use my current location
        </button>
        <Button type="submit" variant="primary" disabled={busy} className="self-end">
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </form>

      {message && (
        <p role="status" className="rounded-xl bg-accent/10 px-3 py-2 text-sm text-accent">
          {message}
        </p>
      )}

      <section ref={calendarSection} className="flex scroll-mt-4 flex-col gap-3 border-t border-line pt-5">
        <h3 className="text-sm font-medium text-ink">Google Calendar</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Open Google Calendar on a computer and go to Settings.</li>
          <li>Under “Settings for my calendars”, pick a calendar, then “Integrate calendar”.</li>
          <li>Copy “Secret address in iCal format”, then tap Paste link here. Your Mac’s clipboard reaches your iPhone through Handoff.</li>
        </ol>
        <Button variant="primary" onClick={pasteAndConnect} className="self-start">
          Paste link and connect
        </Button>
        <textarea
          value={calendarText}
          onChange={(e) => setCalendarText(e.target.value)}
          rows={3}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
          aria-label="Calendar addresses"
          className="w-full resize-none rounded-xl border border-line bg-white/[0.03] px-3 py-2.5 font-sans text-base break-all text-ink placeholder:text-faint focus:border-accent/60 focus:outline-none sm:text-sm"
        />
        <p className="text-xs text-faint">The secret address stays on this device. Events sync every 15 minutes and are read-only in dash.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => connect(calendarText)}>
            {profile.calendarUrls?.length ? 'Save changes' : 'Connect typed link'}
          </Button>
          {calendar.status !== 'off' && (
            <Button onClick={calendar.sync} disabled={calendar.status === 'syncing'}>
              {calendar.status === 'syncing' ? 'Syncing…' : 'Sync now'}
            </Button>
          )}
        </div>
        {calendar.status === 'error' && <p className="text-sm text-red-300/90">{calendar.error}</p>}
        {calendar.status === 'ok' && calendar.syncedAt && (
          <p className="text-sm text-muted">
            {calendar.events.length} upcoming events, synced {countdown(new Date(calendar.syncedAt)).replace('today', 'just now')}.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-5">
        <h3 className="text-sm font-medium text-ink">Calendar file import</h3>
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
