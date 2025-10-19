// src/pages/_app.tsx
import type { AppProps } from 'next/app'
import '../styles/globals.css'
import '../styles/highlight.css'
import Layout from '@/components/layout/Layout'

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    )
}
export default MyApp
