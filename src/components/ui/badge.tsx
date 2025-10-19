// src/components/ui/badge.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "outline";
}

export function Badge({ className, variant = "secondary", ...props }: BadgeProps) {
    const variants = {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-muted text-foreground",
        outline: "border border-border text-foreground",
    } as const;

    return (
        <div
            className={cn(
                // compact pill
                "inline-flex items-center rounded-md px-1.5 py-0 text-[11px] leading-5",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}
