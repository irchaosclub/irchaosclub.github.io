import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { allPosts, Post } from "contentlayer/generated";

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
            <Head><title>{post.title}</title></Head>
            <article className="prose prose-invert mx-auto py-8">
                <h1>{post.title}</h1>
                <p className="text-sm text-muted-foreground">
                    <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "2-digit" })}
                    </time>
                </p>
                <div className="mt-6" dangerouslySetInnerHTML={{ __html: post.body.html }} />
            </article>
        </>
    );
}
