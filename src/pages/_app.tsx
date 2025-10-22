import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import "../styles/globals.css";
import "../styles/highlight.css";
import Layout from "@/components/layout/Layout";

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Full-screen pages without layout
  const fullScreenPages = ['/graph'];
  const isFullScreen = fullScreenPages.includes(router.pathname);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      {isFullScreen ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </>
  );
}
