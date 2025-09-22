import DashboardClient from "@/components/DashboardClient";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const user = await requireAuth(); // Capture the user

  return <DashboardClient user={user} />; // Pass it to the client component
}