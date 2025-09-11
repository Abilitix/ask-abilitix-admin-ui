export const runtime = "nodejs";
export async function GET() {
  const keys = ["ADMIN_BASE","ASK_BASE","EMAIL_PROVIDER","MAILTRAP_TOKEN","EMAIL_FROM","ADMIN_TOKEN","DEMO_MODE"];
  const data = Object.fromEntries(
    keys.map(k => [k, k.includes("TOKEN") ? Boolean(process.env[k]) : process.env[k] ?? null])
  );
  return new Response(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json" } });
}
