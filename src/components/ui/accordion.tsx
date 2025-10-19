"use client";
import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
    return <AccordionPrimitive.Item className={cn("border-b border-border py-1", className)} {...props} />;
}

export function AccordionTrigger({
    className,
    children,
    ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) {
    return (
        <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger
                className={cn(
                    "flex w-full items-center justify-between py-2 text-sm font-medium",
                    "hover:text-primary",
                    className
                )}
                {...props}
            >
                {children}
                <span className="ml-3 text-muted-foreground">▾</span>
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
}

export function AccordionContent({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) {
    return (
        <AccordionPrimitive.Content className={cn("pb-2 pt-1 text-sm", className)} {...props} />
    );
}
