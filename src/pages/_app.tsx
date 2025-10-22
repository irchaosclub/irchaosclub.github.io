import type { AppProps } from "next/app";
import "../styles/globals.css";
import "../styles/highlight.css";
import Layout from "@/components/layout/Layout";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
