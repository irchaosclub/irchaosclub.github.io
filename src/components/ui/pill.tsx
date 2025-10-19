import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "soft" | "outline" | "solid";
/** One consistent color for all pills (change var below to switch hue) */
const COLOR_VAR = "--g-blue-br"; // or "--g-aqua-br" / "--g-green-br" / "--g-orange-br"

export function Pill({
    className,
    variant = "soft",
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
    const styles: React.CSSProperties =
        variant === "solid"
            ? {
                ["--pill-bg" as any]: `var(${COLOR_VAR})`,
                ["--pill-fg" as any]: `var(--g-bg0_h)`,
                ["--pill-bd" as any]: `color-mix(in srgb, var(${COLOR_VAR}) 65%, transparent)`,
            }
            : variant === "outline"
                ? {
                    ["--pill-bg" as any]: `transparent`,
                    ["--pill-fg" as any]: `var(${COLOR_VAR})`,
                    ["--pill-bd" as any]: `var(${COLOR_VAR})`,
                }
                : {
                    ["--pill-bg" as any]: `color-mix(in srgb, var(${COLOR_VAR}) 22%, transparent)`,
                    ["--pill-fg" as any]: `var(${COLOR_VAR})`,
                    ["--pill-bd" as any]: `color-mix(in srgb, var(${COLOR_VAR}) 38%, transparent)`,
                };

    return <button className={cn("pill", className)} style={styles} {...props} />;
}
