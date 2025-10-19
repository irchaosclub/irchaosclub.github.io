import Link from "next/link";

export default function Header() {
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
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
                    </nav>
                </div>
            </div>
        </header>
    );
}
