import Head from "next/head";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 — Not Found</title>
      </Head>
      <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-7xl md:text-8xl font-extrabold tracking-tighter">
          404
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Hey look! You found me! Hehe. The Game 😈.
        </p>
      </main>
    </>
  );
}
