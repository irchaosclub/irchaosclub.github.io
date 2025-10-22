import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh grid grid-rows-[auto,1fr,auto] overflow-hidden">
      <Header />
      <main className="min-h-0 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
      <Footer />
    </div>
  );
}
