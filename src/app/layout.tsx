import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import ConditionalTopNav from "@/components/ConditionalTopNav";
import { TenantProvider } from "@/components/TenantContext";

export const metadata: Metadata = { title: "AbilitiX Admin" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const useCdn = process.env.NEXT_PUBLIC_TW_CDN === "1";
  
  // Get user/tenant data from cookies (server-side)
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("aa_email")?.value ?? "";
  const tenantName = cookieStore.get("tenant_name")?.value ?? "";
  const tenantSlug = cookieStore.get("tenant_slug")?.value ?? "";
  
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
        <TenantProvider userEmail={userEmail} tenantName={tenantName} tenantSlug={tenantSlug}>
          <ConditionalTopNav userEmail={userEmail} tenantName={tenantName} tenantSlug={tenantSlug} />
          <main className="mx-auto max-w-6xl px-4 py-8">
            {children}
          </main>
        </TenantProvider>
      </body>
    </html>
  );
}
