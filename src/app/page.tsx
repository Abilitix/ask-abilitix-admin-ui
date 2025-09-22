import DashboardClient from "@/components/DashboardClient";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  // Enforce auth (returns user, but we don't need to pass it to the client component)
  await requireAuth();

  return <DashboardClient />;
}
