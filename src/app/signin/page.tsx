export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import SigninClient from "./SigninClient";

export default async function SigninPage() {
  const user = await getAuthUser();
  if (user) redirect("/");
  return <SigninClient />;
}