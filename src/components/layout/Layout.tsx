import Header from "./Header";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <>
            <Header />
            {/* way wider on desktop */}
            <main className="mx-auto w-full max-w-[1800px] 2xl:max-w-[1920px] px-6">
                {children}
            </main>
        </>
    );
}
