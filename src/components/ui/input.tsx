import * as React from "react"

import { cn } from "../../lib/utils"

// Number fields: no spinner arrows (WebKit/Blink and Firefox).
const NUMBER_CLASSES = "[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"

// forwardRef so callers can focus the field or read its selection (React 18).
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function Input({ className, type, onWheel, ...props }, ref) {
  const isNumber = type === "number"
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      // The mouse wheel must not change a focused number field: blurring it lets the page scroll instead.
      // (React's wheel listener is passive, so preventDefault() can't be used here.)
      onWheel={(event) => {
        if (isNumber && document.activeElement === event.currentTarget) event.currentTarget.blur()
        onWheel?.(event)
      }}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        isNumber && NUMBER_CLASSES,
        className
      )}
      {...props}
    />
  )
})

export { Input }
