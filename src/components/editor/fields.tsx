import { ChevronDown } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

// Filled controls, no borders. 16px text on phones stops iOS from zooming into focused fields.
const control =
  'w-full rounded-[var(--radius-control)] bg-fill px-3.5 text-base text-ink placeholder:text-faint transition-[background-color,box-shadow] duration-150 outline-none focus:bg-surface focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_35%,transparent)] sm:text-[0.9375rem]'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="px-1 text-subhead font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="px-1 text-caption text-faint">{hint}</span>}
    </label>
  )
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-11', className)} {...rest} />
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'resize-none py-2.5', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(control, 'h-11 appearance-none pr-9', className)} {...rest}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
    </div>
  )
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-1">
      <span className="text-body text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn('relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200', checked ? 'bg-accent-fill' : 'bg-fill-strong')}
      >
        <span
          className={cn(
            'absolute top-[2px] left-[2px] size-[27px] rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.18)] transition-transform duration-200 ease-[var(--ease-out-soft)]',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  )
}

/** A group of settings or form rows. */
export function FormGroup({ title, footer, children }: { title?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      {title && <h3 className="px-1 text-headline text-ink">{title}</h3>}
      {children}
      {footer && <div className="px-1 text-caption text-faint">{footer}</div>}
    </section>
  )
}
