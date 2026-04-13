import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Signup = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", skills: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(form.email, form.password, form.name);
      toast({ title: "Account created!", description: "Check your email to confirm, then log in." });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Bot className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="font-display text-3xl font-bold mb-4">Start Your Journey</h2>
          <p className="text-muted-foreground">Create your account and let AI match you with your dream job in minutes.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <Link to="/"><img src={logo} alt="KaizenJobs" className="h-10 mx-auto mb-6" /></Link>
            <h1 className="font-display text-2xl font-bold">Create Account</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign up to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={form.name} onChange={update("name")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={update("password")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="skills" placeholder="React, Python, Data Science..." value={form.skills} onChange={update("skills")} />
            </div>
            <Button type="submit" className="w-full gradient-bg text-primary-foreground hover:opacity-90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
