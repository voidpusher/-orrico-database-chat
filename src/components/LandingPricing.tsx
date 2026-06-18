import { Check, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";

interface LandingPricingProps {
  onGetStartedClick?: () => void;
}

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    description: "Get started with no credit card. Perfect for trying it out.",
    features: [
      "30 AI chat messages / month",
      "1 database connection",
      "Basic rule-based analytics",
      "CSV data import",
      "Dashboard & reports",
    ],
    cta: "Start for free",
    highlighted: false,
    badge: null,
  },
  {
    key: "pro",
    name: "Pro",
    price: 19,
    description: "For growing businesses that need smarter, faster answers.",
    features: [
      "1,000 AI chat messages / month",
      "10 database connections",
      "Semantic RAG chat engine",
      "PostgreSQL & MySQL support",
      "CSV import + all analytics",
      "Priority email support",
    ],
    cta: "Get Pro",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 99,
    description: "Unlimited scale for serious retail operations.",
    features: [
      "Unlimited AI chat messages",
      "Unlimited DB connections",
      "Claude LLM + RAG mode",
      "All database types",
      "GDPR data export & deletion",
      "SLA + dedicated support",
    ],
    cta: "Get Enterprise",
    highlighted: false,
    badge: null,
  },
];

export function LandingPricing({ onGetStartedClick }: LandingPricingProps) {
  return (
    <section id="pricing" className="relative overflow-hidden py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.07),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_70%)]" />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
            <Zap className="h-3.5 w-3.5" />
            Pricing
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Start free. Upgrade when you grow. Cancel anytime — no lock-in.
          </p>
        </div>

        {/* Cards */}
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.key}
              className={`relative flex flex-col overflow-visible border transition-shadow
                ${plan.highlighted
                  ? "border-primary/60 shadow-xl shadow-primary/10 dark:border-primary/40"
                  : "border-white/55 bg-white/68 dark:border-white/10 dark:bg-white/[0.04]"
                }
                backdrop-blur-2xl
              `}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-0.5 text-xs font-semibold text-primary-foreground shadow">
                  {plan.badge}
                </span>
              )}

              <CardHeader className="pb-4 pt-8">
                <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  {plan.name}
                </p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-5xl font-bold tracking-tight text-foreground">
                    ${plan.price}
                  </span>
                  <span className="mb-1.5 text-sm text-muted-foreground">/ mo</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-6">
                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={onGetStartedClick}
                  variant={plan.highlighted ? "default" : "outline"}
                  className={`w-full rounded-xl font-semibold
                    ${!plan.highlighted
                      ? "border-white/65 bg-white/50 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
                      : ""
                    }`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust line */}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No credit card required for Free plan &nbsp;·&nbsp; Upgrades activate instantly &nbsp;·&nbsp; 7-day money-back guarantee
        </p>
      </div>
    </section>
  );
}
