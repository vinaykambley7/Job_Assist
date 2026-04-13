import { motion } from "framer-motion";
import { Upload, Cpu, Briefcase } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload Resume", desc: "Upload your resume and our AI instantly analyzes your skills, experience, and career profile." },
  { icon: Cpu, title: "AI Matches Jobs", desc: "Our smart matching engine compares your profile against thousands of jobs and ranks them by fit." },
  { icon: Briefcase, title: "Apply & Track", desc: "Apply to matched jobs with one click and track all your applications from your dashboard." },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-24">
    <div className="container mx-auto px-4">
      <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
        <p className="text-muted-foreground">Three simple steps to your dream job.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((s, i) => (
          <motion.div key={s.title} className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
            <div className="relative mx-auto mb-6">
              <div className="h-16 w-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto animate-pulse-glow">
                <s.icon className="h-8 w-8 text-primary-foreground" />
              </div>
              <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
