import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      // Checked state - clearly visible blue
      "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:shadow-lg",
      // Unchecked state - clearly visible gray
      "data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:border-gray-300 data-[state=unchecked]:shadow-sm",
      // Dark mode adjustments
      "dark:data-[state=unchecked]:bg-gray-700 dark:data-[state=unchecked]:border-gray-600",
      "dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary",
      // Hover states
      "hover:data-[state=unchecked]:bg-gray-300 hover:data-[state=checked]:bg-primary/90",
      "dark:hover:data-[state=unchecked]:bg-gray-600",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-all duration-200",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        // Always white thumb for maximum contrast
        "bg-white shadow-md border border-gray-100",
        "dark:border-gray-200"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
