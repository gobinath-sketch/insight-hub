import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center section-padding overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--muted))_0%,transparent_50%)]" />
      <div className="relative max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-card mb-8"
        >
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Three products. One platform. Built with AI.</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-6"
        >
          The 24-Hour
          <br />
          <span className="text-gradient">AI Engine</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Turn hours of manual research into seconds of structured, actionable output.
          Job matching, competitive intelligence, and travel planning — unified.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="h-12 px-8 text-base rounded-xl">
            <Link to="/signup">
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base rounded-xl">
            <Link to="/pricing">View pricing</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="glass rounded-2xl p-1 shadow-2xl shadow-black/5">
            <div className="bg-muted rounded-xl aspect-[16/9] flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-3xl">
                {["Job Finder", "Competitive Intel", "Travel Planner"].map((name, i) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="bg-card rounded-lg p-4 border shadow-sm"
                  >
                    <div className="h-2 w-12 bg-foreground/10 rounded mb-3" />
                    <p className="text-sm font-medium">{name}</p>
                    <div className="h-1.5 w-20 bg-foreground/5 rounded mt-2" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
