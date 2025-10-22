import Head from "next/head";
import { SITE_CONFIG } from "@/lib/constants";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: "website" | "article";
  ogImage?: string;
  article?: {
    publishedTime?: string;
    authors?: string[];
    tags?: string[];
  };
}

export function SEO({
  title,
  description = SITE_CONFIG.description,
  canonical,
  ogType = "website",
  ogImage,
  article,
}: SEOProps) {
  const fullTitle = title
    ? `${title} - ${SITE_CONFIG.shortName}`
    : SITE_CONFIG.name;
  const canonicalUrl = canonical
    ? `${SITE_CONFIG.url}${canonical}`
    : SITE_CONFIG.url;
  const ogImageUrl = ogImage
    ? ogImage.startsWith("http")
      ? ogImage
      : `${SITE_CONFIG.url}${ogImage}`
    : undefined;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_CONFIG.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}

      {/* Article-specific OpenGraph tags */}
      {article && ogType === "article" && (
        <>
          {article.publishedTime && (
            <meta
              property="article:published_time"
              content={article.publishedTime}
            />
          )}
          {article.authors?.map((author) => (
            <meta key={author} property="article:author" content={author} />
          ))}
          {article.tags?.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}
    </Head>
  );
}
