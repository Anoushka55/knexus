import * as React from 'react'

import { cn } from '@/lib/kpmg-dice/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm transition-colors',
          'placeholder:text-slate-400',
          'focus-visible:border-kpmg-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-blue/15',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
