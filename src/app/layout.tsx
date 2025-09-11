import "./globals.css";
import Script from "next/script";
import TopNav from "@/components/TopNav";

export const metadata = { title: "Abilitix Admin" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const useCdn = process.env.NEXT_PUBLIC_TW_CDN === "1";
  return (
    <html lang="en">
      <head>
        {useCdn && (
          <>
            <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
            <Script id="tw-config" strategy="beforeInteractive">
              {`tailwind.config = { darkMode: 'class' }`}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <TopNav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
