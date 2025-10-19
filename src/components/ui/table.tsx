// src/components/ui/table.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
);
Table.displayName = "Table";

const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className={cn("[&_tr]:border-b border-border", className)} {...props} />
);
TableHeader.displayName = "TableHeader";

const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);
TableBody.displayName = "TableBody";

const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={cn("border-b border-border transition-colors hover:bg-muted-30", className)} {...props} />
);

TableRow.displayName = "TableRow";

const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
        className={cn(
            "h-8 px-2 text-left align-middle text-[11px] font-medium text-muted-foreground uppercase tracking-wide",
            className
        )}
        {...props}
    />
);
TableHead.displayName = "TableHead";

const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className={cn("px-2 py-1.5 align-middle", className)} {...props} />
);
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };
