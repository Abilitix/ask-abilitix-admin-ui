export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/signin");      // SSR, single decisive redirect
  return children; // <>children</> vs children is identical – the guard above is what matters
}
