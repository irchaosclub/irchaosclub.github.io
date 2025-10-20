import Link from "next/link";
import { Rss } from "lucide-react";

export default function Header() {
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur shrink-0">
            <div className="mx-auto w-full max-w-[1400px] px-3 md:px-6 py-4 md:py-5">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/" className="group">
                        <div className="leading-tight">
                            <div className="text-sm md:text-xl font-mono tracking-wide text-primary">
                                IRCC — Incident Response Chaos Club
                            </div>
                            <div className="text-sm md:text-base text-muted-foreground">
                                Incident response can be chaotic
                            </div>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-4 text-sm">
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
                        <Link
                            href="/rss.xml"
                            aria-label="RSS feed"
                            title="RSS feed"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted transition-colors"
                        >
                            <Rss className="h-4 w-4 text-orange-500" />
                            <span className="sr-only">RSS</span>
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
