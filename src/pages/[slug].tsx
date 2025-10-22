import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { allPosts, Post } from "contentlayer/generated";
import { ExtendedPost } from "@/types/post";
import { TableOfContents } from "@/components/post/TableOfContents";
import { PostCTA } from "@/components/post/PostCTA";
import { SEO } from "@/components/seo/SEO";
import { Pill } from "@/components/ui/pill";

export async function getStaticPaths() {
  return {
    paths: allPosts.map((p) => ({ params: { slug: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const post = allPosts.find((p) => p.slug === params.slug) || null;
  return { props: { post: post as ExtendedPost } };
}

export default function PostPage({ post }: { post: ExtendedPost }) {
  const external = post.external;
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
          <p>
            Redirecting to external article…{" "}
            <a className="text-primary underline" href={external}>
              Click here if not redirected
            </a>
            .
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <SEO
        title={post.title}
        description={post.description}
        canonical={`/${post.slug}/`}
        ogType="article"
        article={{
          publishedTime: post.date,
          authors: post.authors,
          tags: post.tags,
        }}
      />
      {post.spotifyTrack && (
        <Head>
          <link rel="preconnect" href="https://open.spotify.com" />
          <link rel="dns-prefetch" href="https://open.spotify.com" />
        </Head>
      )}
      <div className="mx-auto w-full max-w-[1400px] px-0 sm:px-3 md:px-6 min-w-0">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8 min-w-0 max-w-full">
          <article className="mobile-article prose-theme mt-6 mx-auto w-full max-w-full sm:max-w-[90ch] lg:max-w-[100ch] min-w-0 px-4 sm:px-0">
            <h1>{post.title}</h1>

            <div className="flex flex-col gap-2 not-prose mb-6">
              <p className="text-sm text-muted-foreground">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "2-digit",
                  })}
                </time>
                {post.readingTime && (
                  <span className="mx-2">•</span>
                )}
                {post.readingTime && (
                  <span>~{post.readingTime} min read</span>
                )}
              </p>

              {post.authors && post.authors.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">By</span>
                  {post.authors.map((author) => (
                    <Link key={author} href={`/?authors=${encodeURIComponent(author)}`}>
                      <Pill variant="soft" className="cursor-pointer hover:bg-primary/20">
                        {author}
                      </Pill>
                    </Link>
                  ))}
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Tags:</span>
                  {post.tags.map((tag) => (
                    <Link key={tag} href={`/?tags=${encodeURIComponent(tag)}`}>
                      <Pill variant="soft" className="cursor-pointer hover:bg-primary/20">
                        {tag}
                      </Pill>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {post.spotifyTrack && (
              <div className="not-prose my-6">
                <p className="text-sm font-medium mb-3">
                  Recommended song to listen to while reading:
                </p>
                <div
                  className="relative"
                  style={{
                    width: "100%",
                    height: "152px",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  {!iframeLoaded && (
                    <div className="absolute inset-0 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-zinc-300">
                          Loading Spotify player...
                        </span>
                      </div>
                    </div>
                  )}
                  <iframe
                    style={{
                      borderRadius: "12px",
                      width: "100%",
                      height: "152px",
                      opacity: iframeLoaded ? 1 : 0,
                      transition: "opacity 0.3s ease-in-out",
                    }}
                    src={`https://open.spotify.com/embed/track/${post.spotifyTrack}?utm_source=generator&theme=0`}
                    frameBorder="0"
                    allowFullScreen={true}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="eager"
                    onLoad={() => setIframeLoaded(true)}
                  />
                </div>
              </div>
            )}

            <div
              id="post-body"
              className="mt-6 mobile-content-wrapper"
              dangerouslySetInnerHTML={{ __html: post.body.html }}
            />
          </article>
          {/* TOC (hidden on smaller screens) */}
          <aside className="hidden xl:block">
            <div className="sticky top-[calc(var(--header-h)+2rem)] pt-8">
              <TableOfContents target="#post-body" />
            </div>
          </aside>
        </div>
      </div>
      <PostCTA title={post.title} slug={post.slug} />
    </>
  );
}
