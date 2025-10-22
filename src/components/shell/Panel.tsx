import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
  header,
  description,
  action,
  titleClassName,
}: {
  className?: string;
  header?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  titleClassName?: string;
}) {
  return (
    <Card className={cn("panel bg-card", className)}>
      {(header || description || action) && (
        <CardHeader className="panel-header pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              {header && (
                <CardTitle
                  className={cn("text-[15px] mono-accent", titleClassName)}
                >
                  {header}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="text-xs">
                  {description}
                </CardDescription>
              )}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}
