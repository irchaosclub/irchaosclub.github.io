"use client";
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>) {
    return (
        <CheckboxPrimitive.Root
            className={cn(
                "peer h-4 w-4 shrink-0 rounded border border-border bg-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator className="flex items-center justify-center">
                <Check className="h-3.5 w-3.5" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}
