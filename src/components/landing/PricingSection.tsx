import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out the platform",
    features: ["5 job searches/mo", "2 competitor reports/mo", "3 travel plans/mo", "Basic AI analysis", "Email support"],
    cta: "Get started",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For professionals who need more power",
    features: ["Unlimited job searches", "20 competitor reports/mo", "Unlimited travel plans", "Advanced AI + cover letters", "Priority support", "PDF exports", "Saved reports"],
    cta: "Start free trial",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Team",
    price: "$79",
    period: "/month",
    description: "For teams and organizations",
    features: ["Everything in Pro", "5 team members", "Workspace collaboration", "API access", "Webhook integrations", "Custom monitoring", "Dedicated support"],
    cta: "Contact sales",
    variant: "outline" as const,
  },
];

export function PricingSection() {
  return (
    <section className="section-padding" id="pricing">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg">Start free. Scale when you're ready.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-card border rounded-2xl p-8 ${plan.popular ? "border-foreground/20 shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-foreground rounded-full">
                  <span className="text-xs font-medium text-primary-foreground">Most popular</span>
                </div>
              )}
              <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <Button asChild variant={plan.variant} className="w-full rounded-xl h-11 mb-8">
                <Link to="/signup">{plan.cta}</Link>
              </Button>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
