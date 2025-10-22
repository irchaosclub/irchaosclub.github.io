import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";
import "../styles/highlight.css";
import Layout from "@/components/layout/Layout";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
