import WelcomePageClient from "@/components/welcome/WelcomePageClient";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WelcomePage() {
  const user = await requireAuth();
  return <WelcomePageClient user={user} />;
}

