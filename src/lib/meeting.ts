/** Online lessons: meeting links (Teams, Zoom, Meet) and how to tell an online class from one on campus. */

const LINK = /https:\/\/(?:teams\.microsoft\.com|teams\.live\.com|[\w-]+\.zoom\.us|zoom\.us|meet\.google\.com)\/[^\s"'<>)\]]+/i

/** The first meeting link in any of these texts (descriptions can be HTML). */
export function findMeetingLink(...texts: Array<string | undefined>): string | undefined {
  for (const t of texts) {
    const m = t?.replace(/&amp;/g, '&').match(LINK)
    if (m) return m[0].replace(/[.,;]+$/, '')
  }
  return undefined
}

/** "Teams", "Zoom" or "Meet". */
export const meetingName = (url: string) => (/zoom\.us/i.test(url) ? 'Zoom' : /meet\.google/i.test(url) ? 'Meet' : 'Teams')

const ONLINE = /\bonline\b|διαδικτυακ|εξ αποστάσεως|εξ αποστασεως|\bteams\b/i

/** Online when the title or notes say so, or when there's a meeting link. */
export const looksOnline = (link: string | undefined, ...texts: Array<string | undefined>) => Boolean(link) || texts.some((t) => t && ONLINE.test(t))
