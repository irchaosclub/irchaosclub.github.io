"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type TocItem = { id: string; text: string; level: 2 | 3 | 4 };

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function TableOfContents({
  target = "#post-body",
}: {
  target?: string;
}) {
  const [items, setItems] = React.useState<TocItem[]>([]);
  const [active, setActive] = React.useState<string | null>(null);

  React.useEffect(() => {
    const root = document.querySelector(target);
    if (!root) return;

    const headings = Array.from(
      root.querySelectorAll<HTMLHeadingElement>("h2, h3, h4")
    );
    const nextItems: TocItem[] = headings
      .map((h) => {
        if (!h.id) {
          const id = slugify(h.textContent || "");
          if (id) h.id = id;
        }
        const level = Number(h.tagName.slice(1)) as 2 | 3 | 4;
        return { id: h.id, text: h.textContent || "", level };
      })
      .filter((i) => !!i.id && !!i.text);

    setItems(nextItems);

    // Observe headings for active state
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target instanceof HTMLElement) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "0px 0px -60% 0px", threshold: [0, 1] }
    );

    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [target]);

  if (!items.length) return null;

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">On this page</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[70vh]">
          <nav className="space-y-1 pr-2">
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "block text-sm hover:underline transition-colors",
                  item.level === 3 ? "pl-4" : item.level === 4 ? "pl-8" : "",
                  active === item.id ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
