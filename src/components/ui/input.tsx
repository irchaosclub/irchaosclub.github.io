import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, leftIcon, ...props }, ref) => {
    return (
        <div className="relative">
            {leftIcon && (
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">{leftIcon}</span>
            )}
            <input
                ref={ref}
                className={cn(
                    "h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm",
                    "ring-offset-background placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    leftIcon ? "pl-9" : "",
                    "mono-accent input-neo",
                    className
                )}
                {...props}
            />
        </div>
    );
});
Input.displayName = "Input";

export { Input };
