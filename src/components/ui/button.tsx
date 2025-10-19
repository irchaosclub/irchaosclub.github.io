import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
}

const variants: Record<Variant, string> = {
    default: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-muted text-foreground hover:bg-muted-80",
    ghost: "bg-transparent hover:bg-muted-30 text-foreground",
    outline: "border border-border bg-transparent hover:bg-muted-30",
    destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
};


const sizes: Record<Size, string> = {
    sm: "h-8 px-2 text-xs",
    md: "h-9 px-3 text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "md", ...props }, ref) => (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center rounded-md transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    )
);
Button.displayName = "Button";
