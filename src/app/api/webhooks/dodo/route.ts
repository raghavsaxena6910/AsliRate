import { dodo, saveSubscription } from "@/lib/billing/server";

/**
 * Dodo Payments calls this when a subscription changes. The signature is
 * checked with DODO_PAYMENTS_WEBHOOK_KEY before anything is trusted.
 * Set the endpoint in Dodo → Developer → Webhooks:
 *   https://www.aslirate.in/api/webhooks/dodo
 */
export async function POST(request: Request) {
  if (!process.env.DODO_PAYMENTS_WEBHOOK_KEY) return new Response("Webhook key not set", { status: 503 });

  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  let event;
  try {
    event = dodo().webhooks.unwrap(body, { headers });
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }

  if (event.type.startsWith("subscription.")) {
    const sub = (event as Extract<typeof event, { type: `subscription.${string}` }>).data;
    const result = await saveSubscription(sub, new Date(event.timestamp));
    if (result === "no-user") console.warn("Dodo subscription with no AsliRate user", sub.subscription_id);
  }
  return Response.json({ received: true });
}
