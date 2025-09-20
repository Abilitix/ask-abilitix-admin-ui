import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import ConditionalTopNav from "@/components/ConditionalTopNav";
import { TenantProvider } from "@/components/TenantContext";
import { getAuthUser } from "@/lib/auth";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = { title: "AbilitiX Admin" };

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
        <TenantProvider>
          <ConditionalTopNav />
          <main className="mx-auto max-w-6xl px-4 py-8">
            {children}
          </main>
          <SiteFooter />
        </TenantProvider>
      </body>
    </html>
  );
}
