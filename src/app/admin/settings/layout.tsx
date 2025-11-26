import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth();

  if (!hasPermission(user.role, "canAccessSettings")) {
    redirect("/admin/inbox");
  }

  return <>{children}</>;
}

