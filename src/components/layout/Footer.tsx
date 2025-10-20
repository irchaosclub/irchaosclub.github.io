// src/components/layout/Footer.tsx
import Link from "next/link";
import { Rss } from "lucide-react"; // npm i lucide-react if you don't have it

export default function Footer() {
    return (
        <footer className="border-t mt-16">
            <div className="mx-auto w-full max-w-[1400px] px-3 md:px-6 py-8 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} irchaos.club
                </p>

                <nav className="flex items-center gap-2">
                    <Link
                        href="/rss.xml"
                        aria-label="RSS feed"
                        title="RSS feed"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted transition-colors"
                    >
                        <Rss className="h-5 w-5 text-orange-500" />
                        <span className="sr-only">RSS</span>
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
