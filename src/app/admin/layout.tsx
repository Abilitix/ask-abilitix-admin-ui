export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import PilotStepper from "@/components/PilotStepper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const user = await getAuthUser();
  if (!user) redirect("/signin");

  // NOTE: TopNav is rendered by the root layout. Do NOT render it here to avoid duplicates.
  return (
    <>
      <PilotStepper />
      <main>{children}</main>
    </>
  );
}
