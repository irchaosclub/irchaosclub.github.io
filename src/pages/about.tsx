// src/pages/about.tsx
import Head from "next/head";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PEOPLE } from "@/components/people/people";
import { PersonCard } from "@/components/people/PersonCard";

export default function About() {
    return (
        <>
            <Head>
                <title>About — IRCC</title>
                <meta
                    name="description"
                    content="About the Incident Response Chaos Club (IRCC) — a collective focused on DFIR, incident response, and security research."
                />
            </Head>

            <main className="mx-auto w-full max-w-[980px] px-3 md:px-6 xl:pt-[calc(var(--header-h)+8px)]">
                {/* Hero */}
                <header className="py-6 md:py-8">
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">About IRCC</h1>
                    <p className="mt-2 text-sm md:text-base text-muted-foreground">
                        Incident Response Chaos Club — embracing the chaos of cybersecurity.
                    </p>
                </header>

                {/* Body copy */}
                <section className="prose prose-invert max-w-none prose-headings:scroll-mt-24">
                    <p>
                        At the <strong>Incident Response Chaos Club (IRCC)</strong>, we embrace the chaos of cybersecurity.
                        We’re a collective of curious minds united by a passion for digital forensics, incident response,
                        and security research. Our mission is to learn, break, analyze, and share.
                    </p>
                    <p>
                        We believe knowledge should flow freely. Through collaboration, experimentation, and community-driven
                        learning, we aim to demystify cybersecurity and empower others to think critically, respond effectively,
                        and defend creatively. Whether you’re a seasoned responder or a newcomer exploring DFIR for the first time,
                        IRCC is a space to share insights, challenge ideas, and celebrate curiosity.
                    </p>
                    <p>
                        <em>The best defense begins with curiosity.</em>
                    </p>
                </section>

                {/* Discord CTA (moved ABOVE Who we are) */}
                <section className="mt-10 md:mt-12 relative rounded-lg border border-border overflow-hidden">
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                "radial-gradient(60% 80% at 95% 0%, rgba(88,101,242,0.20), transparent 60%)",
                        }}
                    />
                    <div className="relative p-4 md:p-5">
                        <div className="flex items-center gap-2">
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#5865F2] text-white shadow">
                                <span className="font-mono text-sm">D</span>
                            </div>
                            <h2 className="text-lg md:text-xl font-semibold">Join us on Discord</h2>
                        </div>
                        <p className="mt-2 text-sm md:text-base text-muted-foreground">
                            Swap DFIR tips, workshop ideas, and hang out with other responders. New folks very welcome.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <a
                                className="inline-flex items-center gap-1 rounded-full bg-[#5865F2] px-3.5 py-2.5 text-sm md:text-base font-medium text-white shadow hover:brightness-110"
                                href="https://discord.gg/hGPsPGMa"
                                target="_blank"
                                rel="noopener"
                            >
                                Join our Discord <ExternalLink className="h-4 w-4" />
                            </a>
                            <a
                                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-3 py-2 text-xs md:text-sm font-medium hover:bg-muted/50"
                                href="https://github.com/irchaosclub/irchaosclub.github.io/wiki/How-to-publish"
                                target="_blank"
                                rel="noopener"
                            >
                                How to get published on irchaos.club
                            </a>
                        </div>
                    </div>
                </section>

                {/* Who we are */}
                <section className="mt-8 md:mt-10">
                    <h2 className="text-xl md:text-2xl font-semibold">Who we are</h2>
                    <div className="mt-3 md:mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {PEOPLE.map((person) => (
                            <PersonCard key={person.name} person={person} />
                        ))}
                    </div>
                </section>

                <footer className="py-8">
                    <Link href="/" className="text-sm underline hover:text-primary">
                        ← Back to posts
                    </Link>
                </footer>
            </main>
        </>
    );
}
