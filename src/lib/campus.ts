import type { CalendarEvent, Course, Profile } from '@/types'

export type Campus = Profile['campus']

/** Lower case, accents removed, final sigma folded: "Πατησίων 76, Αθήνα" → "πατησιων 76, αθηνα". */
export const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').replace(/ς/g, 'σ').toLowerCase().replace(/\s+/g, ' ').trim()

/** Letters and digits only, so "CS310" matches "CS 310". */
const compact = (s: string) => normalize(s).replace(/[^\p{L}\p{N}]/gu, '')

// Greek → Latin, so "Πατησίων 76" and "Patision 76" read the same. Two-letter sounds first.
const PAIRS: Array<[RegExp, string]> = [
  [/ου/g, 'ou'],
  [/αι/g, 'e'],
  [/ει|οι|υι/g, 'i'],
  [/αυ/g, 'av'],
  [/ευ/g, 'ev'],
  [/μπ/g, 'b'],
  [/ντ/g, 'd'],
  [/γκ|γγ/g, 'g'],
]
const LETTERS: Record<string, string> = {
  α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x',
  ο: 'o', π: 'p', ρ: 'r', σ: 's', τ: 't', υ: 'y', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o',
}

/** One spelling for comparing places: no accents, Greek written in Latin letters, punctuation as spaces. */
export function placeKey(s: string): string {
  let t = normalize(s)
  for (const [re, to] of PAIRS) t = t.replace(re, to)
  t = t.replace(/[α-ω]/g, (c) => LETTERS[c] ?? c)
  // Latin spellings of the same sounds: "ou"/"u", "y"/"i", "ch"/"h".
  return t
    .replace(/ou/g, 'u')
    .replace(/y/g, 'i')
    .replace(/ch/g, 'h')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Words that say "street" rather than which street.
const FILLER = new Set(['str', 'street', 'st', 'odos', 'odu', 'leof', 'leoforos', 'leoforu', 'av', 'ave', 'avenue', 'rd', 'road', 'pl', 'plateia', 'square', 'the', 'and', 'kai', 'tis', 'tu', 'ton', 'ke'])

/** "Patision 76, Athens" → street words ["patision"], number "76", area words ["athens"]. */
function parseAddress(address: string) {
  const [first = '', ...rest] = address.split(',')
  const words = placeKey(first).split(' ').filter(Boolean)
  const number = words.find((w) => /^\d+[a-z]?$/.test(w))
  const street = words.filter((w) => w !== number && !/^\d/.test(w) && w.length >= 3 && !FILLER.has(w))
  const area = placeKey(rest.join(' '))
    .split(' ')
    .filter((w) => w.length >= 4 && !/^\d/.test(w) && !FILLER.has(w))
  return { street, number, area }
}

const hasWord = (words: string[], w: string) => words.some((x) => x === w || (w.length >= 5 && x.startsWith(w)))

/**
 * Whether an event is at the campus saved in Settings: the street and number of the saved address appear in its
 * location in any spelling ("Πατησίων 76, Αθήνα 104 34" matches "Patision Str. 76"), or the street and the area.
 */
export function atCampus(location: string | undefined, campus: Campus): boolean {
  if (!location || !campus?.address) return false
  const words = placeKey(location).split(' ')
  const { street, number, area } = parseAddress(campus.address)
  if (!street.length || !street.every((w) => hasWord(words, w))) return false
  if (number) return words.includes(number)
  return area.length > 0 && area.some((w) => hasWord(words, w))
}

/** "Patision 76" from "Patision 76, Athens 104 34", for short labels. */
export const campusLabel = (campus: Campus) => campus?.address.split(',')[0].trim() || 'campus'

/** The places in the calendar used most often, to offer as the campus address. */
export function frequentLocations(events: CalendarEvent[], max = 3): string[] {
  const counts = new Map<string, { label: string; n: number }>()
  for (const e of events) {
    const loc = e.location?.trim()
    if (!loc || e.allDay || /https?:|teams|zoom|meet\.google/i.test(loc)) continue
    // Same street and number = same place, whatever the spelling ("Πατησίων 76, Αθήνα" / "Patision Str. 76").
    const key = placeKey(loc.split(',')[0])
      .split(' ')
      .filter((w) => !FILLER.has(w))
      .join(' ')
    const hit = counts.get(key)
    counts.set(key, { label: hit?.label ?? loc, n: (hit?.n ?? 0) + 1 })
  }
  return [...counts.values()]
    .filter((c) => c.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, max)
    .map((c) => c.label)
}

// normalize() strips accents and turns ς into σ, so "Εξετάσεις" reads "εξετασεισ".
const EXAM_WORDS = /\b(exams?|midterms?|finals?)\b|εξετασ(η|εισ)/
// "Warm-up before the exam" is a study session, not the exam.
const AROUND_EXAM = /(πριν|μετα|για) (την |τισ |το )?εξετασ|\b(before|after|for) (the |my )?exams?\b/

/** Whether a calendar title is an exam: accents and capitals don't matter ("ΕΞΕΤΑΣΗ ΣΗΜΑΤΑ" counts). */
export const isExamTitle = (title: string) => {
  const t = normalize(title)
  return EXAM_WORDS.test(t) && !AROUND_EXAM.test(t)
}

/** @deprecated use isExamTitle; kept so `.test(title)` callers keep working. */
export const EXAM = { test: isExamTitle }

/** A class at campus: on campus, timed, and not an exam (exams keep their own highlight). */
export const isClass = (e: CalendarEvent, campus: Campus) => e.kind === 'event' && !e.allDay && atCampus(e.location, campus) && !EXAM.test(e.title)

/** The course an event title refers to: same name, or the course code / name appears in the title. */
export function matchCourse(title: string, courses: Course[]): Course | undefined {
  const t = normalize(title)
  const tight = compact(title)
  return (
    courses.find((c) => c.name && normalize(c.name) === t) ??
    courses.find((c) => (compact(c.code).length > 1 && tight.includes(compact(c.code))) || (c.name.length > 3 && t.includes(normalize(c.name)))) ??
    courses.find((c) => c.name.length > 3 && t.length > 3 && normalize(c.name).includes(t))
  )
}
