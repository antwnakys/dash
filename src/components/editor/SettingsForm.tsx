import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { useDashboard } from '@/context/DashboardContext'
import { currentPosition, searchPlace } from '@/data/weather'
import { countdown } from '@/lib/date'
import { parseIcs } from '@/lib/ics'
import { BUILD, BUILT_AT } from '@/lib/liveUpdate'
import { isNative } from '@/lib/native'
import type { ThemePreference } from '@/types'
import { Field, FormGroup, TextArea, TextInput } from './fields'

const isCalendarUrl = (u: string) => /^(https?|webcal):\/\/\S+/i.test(u.trim())

const themes: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'Automatic' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function SettingsForm({ onDone, section }: { onDone: () => void; section?: 'calendar' }) {
  const { profile, setProfile, events, courses, calendar, cloud, loadSample, clearAll, theme, notify } = useDashboard()
  const [calendarText, setCalendarText] = useState((profile.calendarUrls ?? []).join('\n'))
  const [name, setName] = useState(profile.name)
  const [city, setCity] = useState(profile.place?.name ?? '')
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const calendarSection = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (section === 'calendar') calendarSection.current?.scrollIntoView({ block: 'start' })
  }, [section])

  const connect = (text: string) => {
    const urls = text.split(/\s+/).filter(isCalendarUrl)
    setProfile({ calendarUrls: urls })
    setCalendarText(urls.join('\n'))
    notify(urls.length ? 'Calendar connected' : 'Calendar disconnected')
  }

  const pasteAndConnect = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim()
      if (!isCalendarUrl(text)) {
        notify('The clipboard doesn’t hold a calendar link. Copy the secret iCal address first.', 'error')
        return
      }
      connect([calendarText, text].filter(Boolean).join('\n'))
    } catch {
      notify('Couldn’t read the clipboard. Paste into the box below instead.', 'error')
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
          notify(`No place called “${trimmed}” was found. Check the spelling.`, 'error')
          return
        }
        place = found
      }
      setProfile({ name: name.trim(), place })
      notify('Settings saved')
      onDone()
    } catch {
      notify('Couldn’t reach the location service. Check your connection.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const useLocation = async () => {
    try {
      const here = await currentPosition()
      const place = { ...here, name: 'Current location' }
      setProfile({ place })
      setCity(place.name)
      notify('Weather follows your location')
    } catch {
      notify('Location access is off. Allow it in iPhone Settings, or type a city.', 'error')
    }
  }

  const importIcs = async (file: File) => {
    const imported = parseIcs(await file.text())
    if (imported.length === 0) {
      notify('No upcoming events were found in that file.', 'error')
      return
    }
    const ids = new Set(imported.map((e) => e.id))
    events.set((list) => [...list.filter((e) => !ids.has(e.id)), ...imported])
    notify(`Imported ${imported.length} ${imported.length === 1 ? 'event' : 'events'}`)
  }

  return (
    <div className="flex flex-col gap-8">
      <FormGroup title="Appearance">
        <Segmented label="Theme" options={themes} value={theme.preference} onChange={theme.setPreference} block />
      </FormGroup>

      <form onSubmit={save}>
        <FormGroup title="You">
          <Field label="Name" hint="Used in the greeting.">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
          </Field>
          <Field label="Weather location">
            <TextInput value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" autoComplete="address-level2" />
          </Field>
          <div className="flex items-center justify-between gap-2">
            <Button variant="plain" size="sm" onClick={useLocation} className="-ml-3">
              Use my current location
            </Button>
            <Button type="submit" variant="primary" disabled={busy} className="min-w-24">
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </FormGroup>
      </form>

      <div ref={calendarSection} className="scroll-mt-4">
        <FormGroup
          title="Google account"
          footer="Signing in on every device keeps your courses, deadlines, events and tasks the same everywhere. dash stores them in a private folder in your Google Drive that only dash can see, and only reads your calendar."
        >
          {calendar.google.account ? (
            <div className="surface flex items-center gap-3 px-4 py-3">
              <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/12 text-headline text-accent">
                {(calendar.google.account.name ?? calendar.google.account.email).slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium text-ink">{calendar.google.account.name ?? 'Google account'}</span>
                <span className="block truncate text-subhead text-muted">{calendar.google.account.email}</span>
              </span>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  await calendar.google.disconnect()
                  notify('Google Calendar disconnected')
                }}
              >
                Disconnect
              </Button>
            </div>
          ) : calendar.google.available ? (
            <Button
              variant="primary"
              className="w-full"
              disabled={calendar.google.connecting}
              onClick={async () => {
                try {
                  await calendar.google.connect()
                  notify('Google Calendar connected')
                } catch (e) {
                  notify(e instanceof Error && /cancel|closed/i.test(e.message) ? 'Sign-in cancelled' : 'Couldn’t connect to Google. Try again.', 'error')
                }
              }}
            >
              {calendar.google.connecting ? 'Waiting for Google…' : 'Connect with Google'}
            </Button>
          ) : (
            <p className="px-1 text-subhead text-muted">Google sign-in isn’t set up in this build yet. Use an iCal link below.</p>
          )}
          {calendar.google.account && (
            <div className="surface flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block text-body font-medium text-ink">Sync across devices</span>
                <span className={`block text-subhead ${cloud.status === 'error' || cloud.status === 'paused' ? 'text-danger' : 'text-muted'}`}>
                  {cloud.status === 'syncing'
                    ? 'Syncing…'
                    : cloud.status === 'paused' || cloud.status === 'error'
                      ? cloud.error
                      : cloud.lastSyncedAt
                        ? `Up to date, synced ${countdown(new Date(cloud.lastSyncedAt)).replace('today', 'just now')}`
                        : 'Waiting for the first sync'}
                </span>
              </span>
              {cloud.status === 'paused' ? (
                <Button size="sm" variant="primary" onClick={() => calendar.google.connect().then(cloud.syncNow).catch(() => {})}>
                  Reconnect
                </Button>
              ) : (
                <Button size="sm" onClick={cloud.syncNow} disabled={cloud.status === 'syncing'}>
                  Sync now
                </Button>
              )}
            </div>
          )}
          {calendar.status === 'reconnect' && calendar.google.account && (
            <Button size="sm" variant="primary" onClick={() => calendar.google.connect().catch(() => {})} className="self-start">
              Reconnect
            </Button>
          )}
          {calendar.status !== 'off' && (
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="min-w-0 text-subhead text-muted">
                {calendar.status === 'syncing'
                  ? 'Syncing…'
                  : calendar.syncedAt
                    ? `${calendar.events.length} upcoming events, synced ${countdown(new Date(calendar.syncedAt)).replace('today', 'just now')}.`
                    : 'Not synced yet.'}
              </p>
              <Button size="sm" onClick={calendar.sync} disabled={calendar.status === 'syncing'}>
                Sync now
              </Button>
            </div>
          )}
          {calendar.status === 'error' && <p className="px-1 text-subhead text-danger">{calendar.error}</p>}

          <details className="group">
            <summary className="cursor-pointer list-none px-1 text-subhead font-medium text-accent [&::-webkit-details-marker]:hidden">
              Use an iCal link instead
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              <ol className="list-decimal space-y-1 pl-6 text-subhead text-muted">
                <li>On a computer, open Google Calendar → Settings.</li>
                <li>Pick a calendar, then “Integrate calendar”.</li>
                <li>Copy “Secret address in iCal format”, then tap below.</li>
              </ol>
              <p className="px-1 text-caption text-faint">iCal links sync in the iPhone app; browsers block them.</p>
              <Button onClick={pasteAndConnect} className="w-full">
                Paste link and connect
              </Button>
              <TextArea
                value={calendarText}
                onChange={(e) => setCalendarText(e.target.value)}
                rows={3}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
                aria-label="Calendar addresses, one per line"
                className="break-all"
              />
              <Button size="sm" onClick={() => connect(calendarText)} className="self-start">
                {profile.calendarUrls?.length ? 'Save addresses' : 'Connect typed address'}
              </Button>
            </div>
          </details>
        </FormGroup>
      </div>

      <FormGroup title="Import" footer="Importing the same file again updates those events instead of duplicating them.">
        <p className="px-1 text-subhead text-muted">Add events from an .ics file, such as an Apple Calendar export or your school portal.</p>
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
        <Button size="sm" onClick={() => fileInput.current?.click()} className="self-start">
          Choose .ics file
        </Button>
      </FormGroup>

      <FormGroup title="Data" footer="Everything is stored on this device only.">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              if (courses.items.length && !confirm('Replace your courses, deadlines, events and tasks with sample data?')) return
              loadSample()
              notify('Sample data loaded')
              onDone()
            }}
          >
            Load sample data
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (!confirm('Delete all courses, deadlines, events and tasks on this device?')) return
              clearAll()
              notify('All data deleted')
              onDone()
            }}
          >
            Delete all data
          </Button>
        </div>
      </FormGroup>

      <FormGroup
        title="About"
        footer={isNative ? 'The app downloads new versions from the website by itself and switches to them the next time you open it.' : undefined}
      >
        <p className="px-1 text-subhead text-muted">
          Version <span className="font-medium text-ink tabular-nums">{BUILD}</span> · built{' '}
          {BUILT_AT.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </FormGroup>
    </div>
  )
}
