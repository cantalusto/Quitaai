"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Label = forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none text-foreground/90 mb-1.5 block",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";
