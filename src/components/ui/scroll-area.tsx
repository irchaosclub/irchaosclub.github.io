"use client";
import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

export function ScrollArea({
    className,
    children,
    ...props
}: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>) {
    return (
        <ScrollAreaPrimitive.Root className={cn("overflow-hidden", className)} {...props}>
            <ScrollAreaPrimitive.Viewport className="h-full w-full">{children}</ScrollAreaPrimitive.Viewport>
            <ScrollAreaPrimitive.Scrollbar
                orientation="vertical"
                className="flex touch-none select-none bg-transparent p-0.5"
            >
                <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded bg-muted-foreground/30" />
            </ScrollAreaPrimitive.Scrollbar>
        </ScrollAreaPrimitive.Root>
    );
}
