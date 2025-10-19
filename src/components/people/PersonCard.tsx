// src/components/people/PersonCard.tsx
import { Globe, Github, Mail, Twitter, Linkedin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export type Person = {
    name: string;
    role?: string;
    bio?: string;
    links?: {
        website?: string;
        github?: string;
        linkedin?: string; // NEW
        twitter?: string;  // X/Twitter
        email?: string;    // mailto:
    };
};

export function PersonCard({ person, className }: { person: Person; className?: string }) {
    const { name, role, bio, links } = person;
    return (
        <article
            className={cn(
                "rounded-lg border border-border bg-card/60 p-3 md:p-4 hover:bg-muted/20 transition-colors",
                className
            )}
        >
            <header className="space-y-1">
                <h3 className="text-base md:text-lg font-semibold leading-tight">{name}</h3>
                {role ? <p className="text-xs md:text-sm text-muted-foreground">{role}</p> : null}
            </header>

            {bio ? (
                <p className="mt-2 text-sm md:text-base leading-relaxed break-words whitespace-pre-line">
                    {bio}
                </p>
            ) : null}

            {(links?.website || links?.github || links?.linkedin || links?.twitter || links?.email) && (
                <ul className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    {links?.website && (
                        <li>
                            <a
                                href={links.website}
                                target="_blank"
                                rel="noopener"
                                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 hover:bg-muted/40"
                            >
                                <Globe className="h-4 w-4" />
                                Website
                                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                            </a>
                        </li>
                    )}
                    {links?.github && (
                        <li>
                            <a
                                href={links.github}
                                target="_blank"
                                rel="noopener"
                                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 hover:bg-muted/40"
                            >
                                <Github className="h-4 w-4" />
                                GitHub
                                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                            </a>
                        </li>
                    )}
                    {links?.linkedin && (
                        <li>
                            <a
                                href={links.linkedin}
                                target="_blank"
                                rel="noopener"
                                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 hover:bg-muted/40"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="h-4 w-4" />
                                LinkedIn
                                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                            </a>
                        </li>
                    )}
                    {links?.twitter && (
                        <li>
                            <a
                                href={links.twitter}
                                target="_blank"
                                rel="noopener"
                                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 hover:bg-muted/40"
                            >
                                <Twitter className="h-4 w-4" />
                                Twitter/X
                                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                            </a>
                        </li>
                    )}
                    {links?.email && (
                        <li>
                            <a
                                href={links.email}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 hover:bg-muted/40"
                            >
                                <Mail className="h-4 w-4" />
                                Email
                            </a>
                        </li>
                    )}
                </ul>
            )}
        </article>
    );
}
