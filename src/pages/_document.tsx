import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Incident Response Chaos Club"
          href="/rss.xml"
        />
        <script
          async
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="78db5465-4eb6-4f3d-a40f-e952e8822134"
        ></script>
      </Head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
                        (function() {
                            try {
                                const savedTheme = localStorage.getItem('ircc-theme');
                                if (savedTheme) {
                                    document.documentElement.classList.add('theme-' + savedTheme);
                                } else {
                                    // Default to gruvbox-dark if no theme is saved
                                    document.documentElement.classList.add('theme-gruvbox-dark');
                                }
                            } catch (e) {
                                // Fallback if localStorage is not available
                                document.documentElement.classList.add('theme-gruvbox-dark');
                            }
                        })();
                        `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
