import Link from "next/link";
import { Rss } from "lucide-react";
import ThemePicker from "../theme/ThemePicker";

export default function Header() {
    return (
        <header className="relative md:sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur shrink-0">
            <div className="mx-auto w-full max-w-[1400px] px-3 md:px-6 py-2 md:py-5">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/" className="group">
                        <div className="leading-tight">
                            {/* Mobile: Just "IRCC" */}
                            <div className="block md:hidden text-lg font-mono tracking-wide text-primary">
                                IRCC
                            </div>
                            {/* Desktop: Full title */}
                            <div className="hidden md:block text-xl font-mono tracking-wide text-primary">
                                IRCC — Incident Response Chaos Club
                            </div>
                            <div className="hidden md:block text-base text-muted-foreground">
                                Incident response can be chaotic
                            </div>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
                        <Link href="/about" className="hover:underline">
                            About
                        </Link>
                        <a
                            href="https://discord.gg/hGPsPGMa"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                        >
                            Discord
                        </a>
                        
                        {/* Theme picker - now visible on mobile */}
                        <ThemePicker />
                        
                        {/* RSS button - desktop only */}
                        <Link
                            href="/rss.xml"
                            aria-label="RSS feed"
                            title="RSS feed"
                            className="hidden md:inline-flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-md border hover:bg-muted transition-colors"
                        >
                            <Rss className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                            <span className="sr-only">RSS</span>
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
