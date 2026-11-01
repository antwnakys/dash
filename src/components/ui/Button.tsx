import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'quiet' | 'danger'

const styles: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink font-semibold hover:brightness-110',
  quiet: 'bg-white/[0.05] text-ink hover:bg-white/[0.08]',
  danger: 'text-red-300/90 hover:bg-red-400/10',
}

export function Button({ variant = 'quiet', className, ...rest }: { variant?: Variant } & HTMLMotionProps<'button'>) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      className={cn('rounded-xl px-4 py-2.5 text-sm transition-[background,filter] disabled:opacity-50', styles[variant], className)}
      {...rest}
    />
  )
}
