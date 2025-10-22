"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type TocItem = {
  id: string;
  text: string;
  level: 2 | 3 | 4;
  parentId?: string;
};

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

    let lastH2Id: string | undefined;
    let lastH3Id: string | undefined;

    const nextItems: TocItem[] = headings
      .map((h) => {
        if (!h.id) {
          const id = slugify(h.textContent || "");
          if (id) h.id = id;
        }
        const level = Number(h.tagName.slice(1)) as 2 | 3 | 4;

        let parentId: string | undefined;
        if (level === 2) {
          lastH2Id = h.id;
          lastH3Id = undefined;
        } else if (level === 3) {
          parentId = lastH2Id;
          lastH3Id = h.id;
        } else if (level === 4) {
          parentId = lastH3Id || lastH2Id;
        }

        return {
          id: h.id,
          text: h.textContent || "",
          level,
          parentId
        };
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
      { rootMargin: "-20% 0% -70% 0%", threshold: [0, 1] }
    );

    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [target]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  if (!items.length) return null;

  // Find active parent for collapsing
  const activeItem = items.find(t => t.id === active);
  const activeParent = activeItem?.level === 3 || activeItem?.level === 4
    ? activeItem.parentId
    : activeItem?.id;

  // Calculate progress
  const activeIndex = items.findIndex(item => item.id === active);
  const progress = activeIndex >= 0 ? ((activeIndex + 1) / items.length) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          On this page
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[70vh]">
          <nav className="space-y-0.5 pr-2">
            {items.map((item) => {
              // Collapse logic: hide h3/h4 if not under active h2
              if ((item.level === 3 || item.level === 4) && item.parentId !== activeParent && item.id !== active) {
                return null;
              }

              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={cn(
                    "relative block py-2 px-3 text-sm transition-all duration-200 rounded-md",
                    item.level === 3 && "pl-6 text-[13px]",
                    item.level === 4 && "pl-9 text-[13px]",
                    active === item.id
                      ? "text-primary font-medium bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {/* Active indicator */}
                  {active === item.id && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full" />
                  )}

                  {/* Level indicator for nested items */}
                  {item.level === 3 && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-1 bg-muted-foreground/40 rounded-full" />
                  )}
                  {item.level === 4 && (
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 w-1 h-1 bg-muted-foreground/40 rounded-full" />
                  )}

                  {item.text}
                </a>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Progress indicator */}
        {items.length > 1 && (
          <div className="mt-4 pt-4 border-t">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
