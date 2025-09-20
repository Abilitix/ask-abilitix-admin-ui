export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import SiteFooter from "@/components/SiteFooter";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();   // server-only
  if (!user) redirect("/signin");
  
  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
