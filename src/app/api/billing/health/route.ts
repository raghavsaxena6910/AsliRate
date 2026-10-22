import { getCurrentUser } from "@/lib/auth/dal";
import { billingHealth } from "@/lib/billing/server";

/**
 * Signed-in check that each billing setting works. Returns yes/no only,
 * never key values.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Not found", { status: 404 });
  return Response.json(await billingHealth());
}
