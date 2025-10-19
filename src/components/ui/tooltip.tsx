"use client";
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
    return (
        <TooltipPrimitive.Provider>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
                <TooltipPrimitive.Content side="top" sideOffset={8} className="z-50 rounded border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow">
                    {content}
                    <TooltipPrimitive.Arrow className="fill-popover" />
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}
