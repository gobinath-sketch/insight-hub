import { motion } from "framer-motion";
import { Briefcase, Shield, Plane, Zap, Brain, Globe } from "lucide-react";

const products = [
  {
    icon: Briefcase,
    title: "Job Opportunity Finder",
    description: "Upload your resume, get AI-matched jobs with fit scores, gap analysis, and personalized cover letters.",
    features: ["Resume parsing", "Multi-platform aggregation", "Match scoring", "Cover letter drafts"],
  },
  {
    icon: Shield,
    title: "Competitive Intelligence",
    description: "Monitor competitors in real-time. Get SWOT analysis, pricing breakdowns, and strategic battlecards.",
    features: ["Website diff detection", "SWOT analysis", "Pricing comparison", "Change monitoring"],
  },
  {
    icon: Plane,
    title: "AI Travel Planner",
    description: "Full itineraries with budget tracking, hidden gems, and creator-recommended spots.",
    features: ["Day-by-day plans", "Budget breakdown", "Local hidden gems", "Route optimization"],
  },
];

const capabilities = [
  { icon: Zap, title: "Instant Processing", desc: "Results in seconds, not hours" },
  { icon: Brain, title: "AI Reasoning", desc: "Structured, actionable insights" },
  { icon: Globe, title: "Multi-Source", desc: "Aggregated from dozens of sources" },
];

export function FeaturesSection() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Three engines. One platform.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Each product leverages web scraping and AI synthesis to transform raw data into intelligence.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {products.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border rounded-2xl p-8 hover-lift"
            >
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-5">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{p.title}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">{p.description}</p>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-foreground/40" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 p-6 rounded-xl border bg-card"
            >
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <c.icon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium mb-1">{c.title}</h4>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
