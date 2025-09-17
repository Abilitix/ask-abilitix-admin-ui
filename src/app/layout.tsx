import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import ConditionalTopNav from "@/components/ConditionalTopNav";
import { TenantProvider } from "@/components/TenantContext";
import { getAuthUser } from "@/lib/auth";

export const metadata: Metadata = { title: "AbilitiX Admin" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const useCdn = process.env.NEXT_PUBLIC_TW_CDN === "1";
  const user = await getAuthUser();
  
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
        <TenantProvider 
          userEmail={user?.email}
          tenantName={user?.tenant_name}
          tenantSlug={user?.tenant_slug}
        >
          <ConditionalTopNav 
            userEmail={user?.email}
            tenantName={user?.tenant_name}
            tenantSlug={user?.tenant_slug}
            userRole={user?.role}
          />
          <main className="mx-auto max-w-6xl px-4 py-8">
            {children}
          </main>
        </TenantProvider>
      </body>
    </html>
  );
}
