import { motion } from "framer-motion";
import { FileText, Search, Bot, Target, ClipboardList, TrendingUp } from "lucide-react";

const features = [
  { icon: FileText, title: "Resume AI Analysis", desc: "Upload your resume and get instant AI-powered skill extraction and improvement suggestions." },
  { icon: Search, title: "Smart Job Search", desc: "Search jobs by role, location, and skills with intelligent filters and real-time results." },
  { icon: Bot, title: "AI Career Assistant", desc: "Chat with our AI assistant for career guidance, interview tips, and personalized job suggestions." },
  { icon: Target, title: "Job Match Score", desc: "See how well you match each job with a percentage score based on your resume and skills." },
  { icon: ClipboardList, title: "Application Tracker", desc: "Track all your job applications in one place with status updates and reminders." },
  { icon: TrendingUp, title: "Skill Gap Analysis", desc: "Identify missing skills for your target roles and get actionable learning recommendations." },
];

const FeaturesSection = () => (
  <section id="features" className="py-24 bg-muted/30">
    <div className="container mx-auto px-4">
      <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
          Everything You Need for <span className="gradient-text">Career Success</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Powerful AI tools designed to simplify your job search and accelerate your career growth.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="glass-card rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-all hover:glow-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="h-12 w-12 rounded-lg gradient-bg flex items-center justify-center mb-4">
              <f.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
