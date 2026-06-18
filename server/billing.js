import Stripe from "stripe";

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export const PLANS = {
  free: {
    key: "free",
    name: "Free",
    priceMonthly: 0,
    monthlyMessages: 30,
    dbConnections: 1,
    ragEnabled: false,
    features: [
      "30 AI chat messages / month",
      "1 database connection",
      "Basic rule-based analytics",
      "CSV import",
    ],
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceMonthly: 19,
    monthlyMessages: 1000,
    dbConnections: 10,
    ragEnabled: true,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "",
    features: [
      "1,000 AI chat messages / month",
      "10 database connections",
      "Semantic RAG chat engine",
      "PostgreSQL & MySQL support",
      "CSV import",
      "Priority email support",
    ],
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    priceMonthly: 99,
    monthlyMessages: Infinity,
    dbConnections: Infinity,
    ragEnabled: true,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
    features: [
      "Unlimited chat messages",
      "Unlimited connections",
      "Semantic RAG + Claude LLM mode",
      "All database types",
      "GDPR data export & deletion",
      "SLA + dedicated support",
    ],
  },
};

// ---------------------------------------------------------------------------
// Stripe client — only initialised when key is present
// ---------------------------------------------------------------------------

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-04-10" });
}

export function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// ---------------------------------------------------------------------------
// Plan helpers
// ---------------------------------------------------------------------------

export function getPlanForUser(user) {
  const key = user?.stripePlanKey || "free";
  return PLANS[key] || PLANS.free;
}

export function getMonthlyMessageCount(data, userId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  return data.chatHistory.filter(
    (entry) => entry.userId === userId && entry.createdAt >= monthStart,
  ).length;
}

export function assertMessageQuota(data, user) {
  const plan = getPlanForUser(user);
  if (plan.monthlyMessages === Infinity) return;

  const used = getMonthlyMessageCount(data, user.id);
  if (used >= plan.monthlyMessages) {
    const err = new Error(
      `You have used all ${plan.monthlyMessages} chat messages for this month on the ${plan.name} plan. Upgrade to continue.`,
    );
    err.code = "QUOTA_EXCEEDED";
    err.currentPlan = plan.key;
    err.upgradeRequired = true;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Stripe checkout session
// ---------------------------------------------------------------------------

export async function createCheckoutSession(user, planKey, successUrl, cancelUrl) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured on this server.");

  const plan = PLANS[planKey];
  if (!plan || !plan.stripePriceId) {
    throw new Error(`Invalid or unconfigured plan: ${planKey}`);
  }

  let customerId = user.stripeCustomerId || null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      metadata: { userId: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId: user.id, planKey },
    subscription_data: {
      metadata: { userId: user.id, planKey },
    },
  });

  return { url: session.url, customerId };
}

// ---------------------------------------------------------------------------
// Stripe customer portal (manage / cancel subscription)
// ---------------------------------------------------------------------------

export async function createPortalSession(customerId, returnUrl) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured on this server.");

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

// ---------------------------------------------------------------------------
// Webhook event handling
// ---------------------------------------------------------------------------

function resolvePlanFromStripeProduct(subscription) {
  // Try metadata first (set at checkout), then price ID matching
  const metaPlan = subscription.metadata?.planKey;
  if (metaPlan && PLANS[metaPlan]) return metaPlan;

  const priceId = subscription.items?.data?.[0]?.price?.id || "";
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId && plan.stripePriceId === priceId) return key;
  }
  return "pro";
}

export function parseWebhookEvent(rawBody, signature) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");

  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");

  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export function extractSubscriptionUpdate(event) {
  const subscription = event.data.object;
  const userId = subscription.metadata?.userId || null;
  const customerId = subscription.customer || null;
  const planKey = resolvePlanFromStripeProduct(subscription);
  const status = subscription.status; // active | trialing | past_due | canceled | unpaid

  return { userId, customerId, planKey, status, subscriptionId: subscription.id };
}
