import * as React from "react";
import { cn } from "@/lib/utils";

type CliSearchProps = React.InputHTMLAttributes<HTMLInputElement> & {
  rightHint?: React.ReactNode;
  className?: string;
  value: string;
};

export function CliSearch({
  rightHint = (
    <span className="hidden md:inline text-xs text-muted-foreground">
      ↵ to search
    </span>
  ),
  className,
  value,
  onChange,
  onFocus,
  onBlur,
  ...rest
}: CliSearchProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const charRef = React.useRef<HTMLSpanElement>(null);
  const caretRef = React.useRef<HTMLDivElement>(null);

  // Track focus state for cursor blinking
  const [isFocused, setIsFocused] = React.useState(false);

  // width of 1 mono character (used to position the underscore)
  const [charWidth, setCharWidth] = React.useState<number>(8);
  React.useEffect(() => {
    // Only run on client-side to avoid SSR mismatch
    if (typeof window === "undefined") return;

    const el = charRef.current;
    if (!el) return;
    const measure = () => setCharWidth(el.getBoundingClientRect().width || 8);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Auto-focus the input on mount (client-side only)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    // Small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      setIsFocused(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const updateCaret = React.useCallback(() => {
    const input = inputRef.current;
    const caret = caretRef.current;
    if (!input || !caret) return;

    // If the input isn’t focused, show the underscore at the END of the text.
    const isActive = document.activeElement === input;
    const pos =
      (isActive ? input.selectionStart ?? value.length : value.length) || 0;

    const scrollX = input.scrollLeft || 0; // account for horizontal scroll in the input
    caret.style.transform = `translateX(${pos * charWidth - scrollX}px)`;
  }, [charWidth, value.length]);

  // Sync on value change and on caret/selection moves
  React.useEffect(() => updateCaret(), [value, updateCaret]);
  React.useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handler = () => updateCaret();
    input.addEventListener("keyup", handler);
    input.addEventListener("click", handler);
    input.addEventListener("keydown", handler);
    input.addEventListener("input", handler);
    input.addEventListener("scroll", handler);

    const selHandler = () => {
      if (document.activeElement === input) updateCaret();
    };
    document.addEventListener("selectionchange", selHandler);

    // initial position on mount
    requestAnimationFrame(updateCaret);

    return () => {
      input.removeEventListener("keyup", handler);
      input.removeEventListener("click", handler);
      input.removeEventListener("keydown", handler);
      input.removeEventListener("input", handler);
      input.removeEventListener("scroll", handler);
      document.removeEventListener("selectionchange", selHandler);
    };
  }, [updateCaret]);

  return (
    <div
      className={cn(
        "w-full rounded-lg border border-border bg-card/70",
        "focus-within:ring-1 focus-within:ring-primary/40",
        className
      )}
    >
      <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3 px-3 h-10">
        {/* Prompt */}
        <div className="font-mono text-[15px] md:text-base leading-6 whitespace-nowrap select-none flex items-center">
          <span className="text-[#83a598]">siem</span>
          <span className="px-[2px] text-muted-foreground">@</span>
          <span className="text-[#fe8019]">ircc</span>
          <span className="px-[4px] text-muted-foreground">$</span>
        </div>

        {/* Input + custom underscore caret (always visible) */}
        <div className="relative h-10 flex items-center">
          <input
            ref={inputRef}
            value={value}
            onChange={onChange}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
              requestAnimationFrame(updateCaret);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
              requestAnimationFrame(updateCaret);
            }}
            {...rest}
            style={{ caretColor: "transparent" }} // hide native caret
            className={cn(
              "h-10 w-full bg-transparent outline-none border-none",
              "font-mono text-[15px] md:text-base leading-6",
              "placeholder:text-muted-foreground/60"
            )}
          />

          {/* Blinking underscore aligned to the baseline.
              We pin it to the bottom of the input (single-line), which matches the text baseline closely. */}
          <div
            ref={caretRef}
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-0",
              "w-[0.7ch] h-[2px] bg-current opacity-90",
              isFocused && "caret-blink",
              "bottom-[7px]" // tweak this 6–8px if your baseline looks off for your font
            )}
          />

          {/* hidden single-char measurer (same font + size) */}
          <span
            ref={charRef}
            className="absolute -z-10 opacity-0 font-mono text-[15px] md:text-base leading-6"
          >
            0
          </span>
        </div>

        <div className="text-xs text-muted-foreground">{rightHint}</div>
      </div>
    </div>
  );
}
