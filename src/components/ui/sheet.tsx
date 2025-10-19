"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
    side = "bottom",
    className,
    children,
    ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "top" | "bottom" | "left" | "right";
}) {
    const sideClass =
        side === "bottom"
            ? "inset-x-0 bottom-0 rounded-t-2xl border-t"
            : side === "top"
                ? "inset-x-0 top-0 rounded-b-2xl border-b"
                : side === "left"
                    ? "inset-y-0 left-0 h-full w-5/6 max-w-sm border-r"
                    : "inset-y-0 right-0 h-full w-5/6 max-w-sm border-l";

    return (
        <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
            <DialogPrimitive.Content
                className={cn(
                    "fixed z-50 bg-card text-card-foreground shadow-lg outline-none",
                    "border border-border",
                    sideClass,
                    className
                )}
                {...props}
            >
                <SheetClose asChild>
                    <button
                        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </SheetClose>

                {children}
            </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
    );
}

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("px-4 pt-4", className)} {...props} />
);
export const SheetTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn("text-base font-semibold", className)} {...props} />
);
export const SheetDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("text-xs text-muted-foreground", className)} {...props} />
);
export const SheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("px-4 pb-4 pt-2", className)} {...props} />
);
export const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex items-center justify-end gap-2 px-4 pb-4", className)} {...props} />
);
