// src/components/layout/Footer.tsx

export default function Footer({ className = "" }: { className?: string }) {
    return (
        <footer className={`border-t shrink-0 ${className}`}>
            <div className="mx-auto w-full max-w-[1400px] px-3 md:px-6 py-4 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} irchaos.club
                </p>
            </div>
        </footer>
    );
}
