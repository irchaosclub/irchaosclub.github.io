// src/components/ui/infobox.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function InfoBox({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "infobox p-4 md:p-5 text-sm leading-relaxed",
                className
            )}
            {...props}
        />
    );
}

