/**
 * Sheet — a slide-in panel built on @base-ui/react/dialog.
 * Drop-in replacement for the previous @base-ui/react/sheet import
 * which does not exist in Base UI v1.
 */
import * as React from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sheet({
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props}>{children}</Dialog.Root>
}

export function SheetTrigger({
  ...props
}: React.ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props} />
}

export function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof Dialog.Popup> & {
  side?: 'left' | 'right'
}) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Popup
        {...props}
        className={cn(
          'fixed z-50 flex flex-col gap-4 border bg-background p-6 shadow-lg',
          side === 'right'
            ? 'inset-y-0 right-0 w-3/4 sm:max-w-sm'
            : 'inset-y-0 left-0 w-3/4 sm:max-w-sm',
          className,
        )}
      >
        {children}
        <Dialog.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
          aria-label="Close"
        >
          <X className="size-4" />
        </Dialog.Close>
      </Dialog.Popup>
    </Dialog.Portal>
  )
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      {...props}
      className={cn('text-lg font-semibold', className)}
    />
  )
}
