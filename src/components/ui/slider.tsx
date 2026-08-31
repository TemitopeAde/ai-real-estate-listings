import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"
import { cn } from "../../lib/utils"

function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return <SliderPrimitive.Root data-slot="slider" className={cn("relative flex w-full touch-none select-none items-center", className)} {...props}><SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-muted"><SliderPrimitive.Range className="absolute h-full bg-primary" /></SliderPrimitive.Track>{(props.value ?? props.defaultValue ?? [0]).map((_, index) => <SliderPrimitive.Thumb key={index} className="block size-4 rounded-full border border-primary/30 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />)}</SliderPrimitive.Root>
}

export { Slider }
