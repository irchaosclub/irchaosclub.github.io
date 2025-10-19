"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Minimal config; feel free to expand if you want multi-series later */
export type ChartConfig = { accent?: string };

export function ChartContainer({
    className,
    children,
    config,
}: React.HTMLAttributes<HTMLDivElement> & { config?: ChartConfig }) {
    const style: React.CSSProperties = {
        ["--chart-accent" as any]: config?.accent ?? "var(--primary)",
        ["--chart-fill" as any]: "color-mix(in srgb, var(--chart-accent) 22%, transparent)",
    };
    return (
        <div className={cn("w-full h-full", className)} style={style} data-chart="">
            {children}
        </div>
    );
}

/** Simple tooltip content matching shadcn look */
export function ChartTooltipContent({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow mono-accent">
            <div className="font-semibold">{label}</div>
            <div>{payload[0].value} post{payload[0].value === 1 ? "" : "s"}</div>
        </div>
    );
}
