import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      // Maximum contrast colors with !important to override any conflicts
      "data-[state=checked]:!bg-primary data-[state=checked]:!border-primary data-[state=checked]:shadow-lg",
      "data-[state=unchecked]:!bg-gray-400 data-[state=unchecked]:!border-gray-500 data-[state=unchecked]:shadow-sm",
      // Dark mode with maximum contrast
      "dark:data-[state=unchecked]:!bg-gray-600 dark:data-[state=unchecked]:!border-gray-500",
      "dark:data-[state=checked]:!bg-primary dark:data-[state=checked]:!border-primary",
      // Enhanced hover states
      "hover:data-[state=unchecked]:!bg-gray-500 hover:data-[state=checked]:!bg-primary/90 hover:shadow-md",
      "dark:hover:data-[state=unchecked]:!bg-gray-500",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-all duration-200",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        // Pure white thumb with black border for maximum contrast
        "!bg-white shadow-md border-2 !border-black",
        "dark:!border-white"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
