export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import TopNav from "@/components/TopNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();   // server-only
  if (!user) redirect("/signin");
  
  return children;
}
