import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { allPosts, Post } from "contentlayer/generated";
import { TableOfContents } from "@/components/post/TableOfContents";

export async function getStaticPaths() {
    return { paths: allPosts.map((p) => ({ params: { slug: p.slug } })), fallback: false };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
    const post = allPosts.find((p) => p.slug === params.slug) || null;
    return { props: { post } };
}

export default function PostPage({ post }: { post: Post }) {
    const router = useRouter();
    const external = (post as any).external as string | undefined;
    const [iframeLoaded, setIframeLoaded] = useState(false);

    useEffect(() => {
        if (external) window.location.replace(external);
    }, [external]);

    if (external) {
        return (
            <>
                <Head>
                    <meta httpEquiv="refresh" content={`0; url=${external}`} />
                    <title>Redirecting…</title>
                </Head>
                <main className="container max-w-3xl mx-auto py-10">
                    <p>Redirecting to external article… <a className="text-primary underline" href={external}>Click here if not redirected</a>.</p>
                </main>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>{post.title}</title>
                {(post as any).spotifyTrack && (
                    <>
                        <link rel="preconnect" href="https://open.spotify.com" />
                        <link rel="dns-prefetch" href="https://open.spotify.com" />
                    </>
                )}
            </Head>
            <div className="mx-auto w-full max-w-[1400px] px-2 sm:px-3 md:px-6 min-w-0">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8 min-w-0 max-w-full">
                    <article className="prose prose-invert mt-6 mx-auto w-full max-w-full sm:max-w-[90ch] lg:max-w-[100ch] min-w-0 overflow-hidden px-0">
                        <h1>{post.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            <time dateTime={post.date}>
                                {new Date(post.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "2-digit" })}
                            </time>
                        </p>
                        
                        {(post as any).spotifyTrack && (
                            <div className="not-prose my-6">
                                <p className="text-sm font-medium mb-3">Recommended song to listen to while reading:</p>
                                <div className="relative" style={{ width: '100%', height: '152px', borderRadius: '12px', overflow: 'hidden' }}>
                                    {!iframeLoaded && (
                                        <div className="absolute inset-0 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="text-sm text-zinc-300">Loading Spotify player...</span>
                                            </div>
                                        </div>
                                    )}
                                    <iframe 
                                        style={{ 
                                            borderRadius: '12px', 
                                            width: '100%', 
                                            height: '152px',
                                            opacity: iframeLoaded ? 1 : 0,
                                            transition: 'opacity 0.3s ease-in-out'
                                        }}
                                        src={`https://open.spotify.com/embed/track/${(post as any).spotifyTrack}?utm_source=generator&theme=0`}
                                        frameBorder="0" 
                                        allowFullScreen={true}
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                        loading="eager"
                                        onLoad={() => setIframeLoaded(true)}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div id="post-body" className="mt-6 mobile-content-wrapper" dangerouslySetInnerHTML={{ __html: post.body.html }} />
                    </article>
                    {/* shadcn TOC (hidden on smaller screens) */}
                    <aside className="hidden xl:block py-8">
                        <TableOfContents target="#post-body" />
                    </aside>
                </div>
            </div>
        </>
    );
}
