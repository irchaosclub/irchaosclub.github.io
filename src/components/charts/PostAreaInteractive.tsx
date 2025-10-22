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
  ReferenceArea,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export type Bin = {
  key: string;
  label: string;
  start: Date;
  end: Date;
  count: number;
};

interface PostAreaInteractiveProps {
  bins: Bin[];
  selectedRange?: { start: Date; end: Date } | null;
  onRangeSelect?: (range: { start: Date; end: Date } | null) => void;
}

export function PostAreaInteractive({
  bins,
  selectedRange,
  onRangeSelect
}: PostAreaInteractiveProps) {
  const data = React.useMemo(() => bins.map((b) => ({ ...b })), [bins]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [selectionStart, setSelectionStart] = React.useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = React.useState<string | null>(null);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel) {
      // Prevent text selection
      if (e.nativeEvent) {
        e.nativeEvent.preventDefault();
      }
      setIsSelecting(true);
      setSelectionStart(e.activeLabel);
      setSelectionEnd(e.activeLabel);
    }
  };

  const handleMouseMove = (e: any) => {
    if (isSelecting && e && e.activeLabel) {
      // Prevent text selection during drag
      if (e.nativeEvent) {
        e.nativeEvent.preventDefault();
      }
      setSelectionEnd(e.activeLabel);
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && selectionStart && selectionEnd) {
      const startIdx = data.findIndex((d) => d.label === selectionStart);
      const endIdx = data.findIndex((d) => d.label === selectionEnd);

      if (startIdx !== -1 && endIdx !== -1) {
        const minIdx = Math.min(startIdx, endIdx);
        const maxIdx = Math.max(startIdx, endIdx);

        const range = {
          start: data[minIdx].start,
          end: data[maxIdx].end,
        };

        // Delay the range selection to allow double-click to cancel it
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
        }
        clickTimeoutRef.current = setTimeout(() => {
          onRangeSelect?.(range);
          setIsSelecting(false);
          setSelectionStart(null);
          setSelectionEnd(null);
          clickTimeoutRef.current = null;
        }, 100);
      }
    } else {
      // No valid selection, clear immediately
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  const handleDoubleClick = () => {
    // Cancel any pending single-click range selection
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    // Double click to clear selection
    onRangeSelect?.(null);
  };

  if (!isMounted) {
    return (
      <div className="w-full h-[180px] bg-muted/20 animate-pulse rounded" />
    );
  }

  // Determine which bins are in the selected range
  let refAreaLeft: string | undefined;
  let refAreaRight: string | undefined;

  if (selectedRange) {
    // Find bins that overlap with the selected range
    const startBin = data.find((d) => d.start <= selectedRange.start && d.end >= selectedRange.start);
    const endBin = data.find((d) => d.start <= selectedRange.end && d.end >= selectedRange.end);
    
    // Fallback to closest bins if exact overlap not found
    if (!startBin) {
      const closestStart = data.reduce((closest, bin) => 
        Math.abs(bin.start.getTime() - selectedRange.start.getTime()) < 
        Math.abs(closest.start.getTime() - selectedRange.start.getTime()) ? bin : closest
      );
      refAreaLeft = closestStart.label;
    } else {
      refAreaLeft = startBin.label;
    }
    
    if (!endBin) {
      const closestEnd = data.reduce((closest, bin) => 
        Math.abs(bin.end.getTime() - selectedRange.end.getTime()) < 
        Math.abs(closest.end.getTime() - selectedRange.end.getTime()) ? bin : closest
      );
      refAreaRight = closestEnd.label;
    } else {
      refAreaRight = endBin.label;
    }
  }
  
  // Show live preview while selecting
  if (isSelecting && selectionStart && selectionEnd) {
    const startIdx = data.findIndex((d) => d.label === selectionStart);
    const endIdx = data.findIndex((d) => d.label === selectionEnd);
    if (startIdx !== -1 && endIdx !== -1) {
      refAreaLeft = data[Math.min(startIdx, endIdx)].label;
      refAreaRight = data[Math.max(startIdx, endIdx)].label;
    }
  }

  return (
    <div 
      className="relative select-none" 
      style={{ 
        userSelect: 'none', 
        WebkitUserSelect: 'none'
      }}
    >
      {selectedRange && (
        <div className="absolute top-0 right-0 z-10">
          <button
            onClick={() => onRangeSelect?.(null)}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted/50 hover:bg-muted transition-colors"
            title="Clear time range selection"
          >
            Clear Range
          </button>
        </div>
      )}
      <ChartContainer
        className="w-full h-[180px] min-h-[180px] cursor-crosshair focus:outline-none select-none [&_svg]:outline-none [&_*]:outline-none"
        config={{ accent: "var(--primary)" }}
        style={{ outline: 'none' }}
      >
        <ResponsiveContainer width="100%" height={180} minHeight={180}>
          <AreaChart
            data={data}
            margin={{ top: 6, right: 8, left: 8, bottom: 8 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            style={{ outline: 'none' }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 6"
              vertical={false}
            />
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
            <Tooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={isSelecting ? 0.6 : 0.3}
                fill="var(--primary)"
                fillOpacity={isSelecting ? 0.35 : 0.2}
                stroke="var(--primary)"
                strokeWidth={isSelecting ? 1 : 0}
              />
            )}
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="color-mix(in srgb, var(--primary) 22%, transparent)"
              dot={{
                r: 2,
                stroke: "var(--primary)",
                strokeWidth: 1,
                fill: "var(--primary)",
              }}
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
      {!selectedRange && (
        <p className="text-xs text-muted-foreground text-center mt-1">
          Click and drag to select a time range • Double-click to clear
        </p>
      )}
    </div>
  );
}
