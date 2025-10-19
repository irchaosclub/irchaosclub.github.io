// src/components/mobile/MobilePostSheet.tsx
"use client";
import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { InfoBox } from "@/components/ui/infobox";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Post } from "contentlayer/generated";

export function MobilePostSheet({
    open,
    onOpenChange,
    post,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    post: Post | null;
}) {
    return (
        <div className="md:hidden">
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                    {!post ? (
                        <SheetHeader>
                            <SheetTitle>No selection</SheetTitle>
                            <SheetDescription>Tap a post to see details.</SheetDescription>
                        </SheetHeader>
                    ) : (
                        <>
                            <SheetHeader>
                                <SheetTitle className="break-words">{post.title}</SheetTitle>
                                <SheetDescription>
                                    <time dateTime={post.date}>
                                        {new Date(post.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "2-digit" })}
                                    </time>
                                </SheetDescription>
                            </SheetHeader>

                            <SheetBody className="space-y-3">
                                {((post as any).authors ?? []).length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {((post as any).authors as string[]).map((a) => (
                                            <Pill key={a} variant="soft">{a}</Pill>
                                        ))}
                                    </div>
                                )}

                                {(post as any).description && (
                                    <InfoBox className="p-3 text-sm leading-relaxed break-words">
                                        {(post as any).description}
                                    </InfoBox>
                                )}

                                {((post as any).tags ?? []).length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {((post as any).tags as string[]).map((t) => (
                                            <Pill key={t} variant="soft">{t}</Pill>
                                        ))}
                                    </div>
                                )}

                                {(post as any).readingTime && (
                                    <p className="text-xs text-muted-foreground">~{(post as any).readingTime} min read</p>
                                )}
                            </SheetBody>

                            <SheetFooter>
                                {((post as any).external as string | undefined) ? (
                                    <a href={(post as any).external as string} className="inline-flex items-center gap-1 text-primary underline">
                                        Open <ExternalLink className="h-4 w-4" />
                                    </a>
                                ) : (
                                    <Link href={`/${post.slug}/`} className="text-primary underline">Open</Link>
                                )}
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
