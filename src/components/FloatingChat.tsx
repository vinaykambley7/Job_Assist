import { useState } from "react";
import { Bot, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const mockResponses = [
  "Based on your resume, I'd recommend focusing on React and TypeScript roles. Your skill set aligns well with frontend engineering positions.",
  "Here are some tips for your next interview: Research the company, prepare STAR-method answers, and practice coding challenges.",
  "I found 3 new jobs matching your profile today! Check your dashboard for the latest recommendations.",
  "To improve your resume, consider adding quantifiable achievements and relevant certifications.",
];

const FloatingChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your AI Career Assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    const aiMsg = { role: "assistant", content: mockResponses[Math.floor(Math.random() * mockResponses.length)] };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="gradient-bg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Bot className="h-5 w-5" />
                <span className="font-display font-semibold text-sm">AI Career Assistant</span>
              </div>
              <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-primary-foreground/70 hover:text-primary-foreground" /></button>
            </div>

            <div className="h-72 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "gradient-bg text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask anything..."
                className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
              <Button size="icon" className="gradient-bg text-primary-foreground h-9 w-9" onClick={send}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full gradient-bg flex items-center justify-center shadow-lg animate-pulse-glow hover:scale-105 transition-transform"
      >
        {open ? <X className="h-6 w-6 text-primary-foreground" /> : <Bot className="h-6 w-6 text-primary-foreground" />}
      </button>
    </>
  );
};

export default FloatingChat;
