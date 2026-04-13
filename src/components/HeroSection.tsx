import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.png";

const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center overflow-hidden hero-gradient">
    <div className="absolute inset-0">
      <img src={heroBg} alt="" className="absolute right-0 top-0 h-full w-3/5 object-cover opacity-40 mix-blend-lighten" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
    </div>

    <div className="container relative z-10 mx-auto px-4 pt-24 pb-16">
      <div className="max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <Bot className="h-3.5 w-3.5" /> AI-Powered Career Platform
          </span>
        </motion.div>

        <motion.h1
          className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
        >
          AI-Powered Job Search{" "}
          <span className="gradient-text">Made Simple</span>
        </motion.h1>

        <motion.p
          className="text-lg text-muted-foreground mb-8 max-w-lg"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
        >
          Upload your resume, get smart job matches, and improve your career with AI-driven insights and recommendations.
        </motion.p>

        <motion.div
          className="flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link to="/signup">
            <Button size="lg" className="gradient-bg text-primary-foreground hover:opacity-90 gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
              <Bot className="h-4 w-4" /> Try AI Assistant
            </Button>
          </Link>
        </motion.div>

        <motion.div
          className="mt-12 flex items-center gap-8 text-sm text-muted-foreground"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div><span className="font-display text-2xl font-bold text-foreground">10K+</span><br />Jobs Matched</div>
          <div className="h-8 w-px bg-border" />
          <div><span className="font-display text-2xl font-bold text-foreground">95%</span><br />Match Accuracy</div>
          <div className="h-8 w-px bg-border" />
          <div><span className="font-display text-2xl font-bold text-foreground">5K+</span><br />Users</div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
