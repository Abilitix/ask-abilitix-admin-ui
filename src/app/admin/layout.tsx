export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import TopNav from "@/components/TopNav";
import PilotStepper from "@/components/PilotStepper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const user = await getAuthUser();
  if (!user) redirect("/signin");

  // NOTE: This is a nested app layout (not the root), so don't render <html>/<body>.
  // TopNav & PilotStepper are client components and will hydrate fine here.
  return (
    <>
      <TopNav
        // Optional: pass props if you have them on your user object; safe to omit.
        // userEmail={user.email}
        // tenantSlug={user.tenant?.slug}
        // userRole={user.role}
      />
      <PilotStepper />
      <main>{children}</main>
    </>
  );
}
