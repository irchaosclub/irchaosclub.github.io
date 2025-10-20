"use client";
import * as React from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export type Bin = { key: string; label: string; start: Date; end: Date; count: number };

export function PostAreaInteractive({ bins }: { bins: Bin[] }) {
    const data = React.useMemo(() => bins.map((b) => ({ ...b })), [bins]);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="w-full h-[180px] bg-muted/20 animate-pulse rounded" />;
    }

    return (
        <ChartContainer className="w-full h-[180px] min-h-[180px]" config={{ accent: "var(--primary)" }}>
            <ResponsiveContainer width="100%" height={180} minHeight={180}>
                <AreaChart data={data} margin={{ top: 6, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        axisLine={{ stroke: "var(--border)" }}
                        tickLine={{ stroke: "var(--border)" }}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        axisLine={{ stroke: "var(--border)" }}
                        tickLine={{ stroke: "var(--border)" }}
                    />
                    <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fill="color-mix(in srgb, var(--primary) 22%, transparent)"
                        dot={{ r: 2, stroke: "var(--primary)", strokeWidth: 1, fill: "var(--primary)" }}
                        activeDot={{ r: 3 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
