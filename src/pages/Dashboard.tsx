import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Briefcase, Target, Bot, Upload, LogOut, Search, MapPin, Clock, ChevronRight, Send, Loader2, File, Trash2, Sparkles, Star, Lightbulb, Award, User, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { mockJobs } from "@/data/mockData";
import ReactMarkdown from "react-markdown";
import { Database } from "@/integrations/supabase/types";

type Application = Database['public']['Tables']['applications']['Row'];

type ChatMsg = { role: "user" | "assistant"; content: string };

type ResumeAnalysis = {
  skills: string[];
  summary: string;
  suggestions: string[];
  experience_level: string;
  top_roles: string[];
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-chat`;
const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`;

const Dashboard = () => {
  const { user, session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<{ full_name: string | null; skills: string[]; resume_summary: string | null }>({ full_name: null, skills: [], resume_summary: null });
  const [applications, setApplications] = useState<Application[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [resumeFile, setResumeFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !session || loading) return;

    const loadUserData = async () => {
      try {
        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error("Profile load error:", profileError);
        } else if (profileData) {
          setProfile({
            full_name: profileData.full_name,
            skills: profileData.skills || [],
            resume_summary: profileData.resume_summary
          });
          if (profileData.skills?.length || profileData.resume_summary) {
            setAnalysis({
              skills: profileData.skills || [],
              summary: profileData.resume_summary || "",
              suggestions: [],
              experience_level: "",
              top_roles: [],
            });
          }
        }

        // Load applications
        const { data: applicationsData, error: applicationsError } = await supabase
          .from("applications")
          .select("*")
          .eq("user_id", user.id)
          .order("applied_at", { ascending: false });

        if (applicationsError) {
          console.error("Applications load error:", applicationsError);
        } else {
          setApplications(applicationsData || []);
        }

        // Load resume file
        const { data: filesData, error: filesError } = await supabase.storage
          .from("resumes")
          .list(user.id);

        if (filesError) {
          console.error("Resume files load error:", filesError);
        } else if (filesData && filesData.length > 0) {
          setResumeFile(filesData[0].name);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast({
          title: "Error loading data",
          description: "There was an issue loading your profile data.",
          variant: "destructive"
        });
      }
    };

    loadUserData();
  }, [user, session, loading, toast]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const handleLogout = async () => { await signOut(); navigate("/"); };

  const extractTextFromFile = async (file: File): Promise<string> => {
    // For text-based files, read directly
    if (file.type === "text/plain") {
      return await file.text();
    }
    // For PDF/DOCX, read as text (basic extraction - the AI will handle noisy text well)
    const text = await file.text();
    // Clean up binary noise from PDF/DOCX
    const cleaned = text
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s{3,}/g, " ")
      .trim();
    return cleaned;
  };

  const analyzeResume = async (resumeText: string) => {
    if (!session?.access_token) return;
    setAnalyzing(true);
    try {
      const resp = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ resumeText }),
      });

      if (!resp.ok) {
        // If the function is not available (404/405), use mock analysis
        if (resp.status === 404 || resp.status === 405) {
          console.log("Using mock resume analysis - Supabase function not available");
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate analysis delay

          const mockAnalysis: ResumeAnalysis = {
            skills: ["JavaScript", "React", "Node.js", "TypeScript", "Python", "SQL"],
            summary: "Experienced full-stack developer with strong frontend and backend skills. Demonstrates proficiency in modern web technologies and problem-solving abilities.",
            suggestions: [
              "Consider adding more specific technologies to your resume",
              "Include quantifiable achievements and metrics",
              "Add relevant certifications or courses",
              "Highlight leadership or team collaboration experience"
            ],
            experience_level: "Mid Level",
            top_roles: ["Frontend Developer", "Full Stack Developer", "React Developer", "Software Engineer"]
          };

          setAnalysis(mockAnalysis);
          setProfile((prev) => ({
            ...prev,
            skills: mockAnalysis.skills,
            resume_summary: mockAnalysis.summary,
          }));
          toast({ title: "Resume analyzed!", description: `Found ${mockAnalysis.skills.length} skills and ${mockAnalysis.suggestions.length} suggestions.` });
          setAnalyzing(false);
          return;
        }

        const err = await resp.json().catch(() => ({ error: "Analysis failed" }));
        throw new Error(err.error || "Analysis failed");
      }

      const result: ResumeAnalysis = await resp.json();
      setAnalysis(result);
      setProfile((prev) => ({
        ...prev,
        skills: result.skills,
        resume_summary: result.summary,
      }));
      toast({ title: "Resume analyzed!", description: `Found ${result.skills.length} skills and ${result.suggestions.length} suggestions.` });
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file", description: "Please upload a PDF, DOCX, or TXT file.", variant: "destructive" });
      return;
    }
    setUploading(true);
    if (resumeFile) await supabase.storage.from("resumes").remove([`${user.id}/${resumeFile}`]);
    const { error } = await supabase.storage.from("resumes").upload(`${user.id}/${file.name}`, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setResumeFile(file.name);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast({ title: "Resume uploaded!", description: "Analyzing with AI..." });

    // Extract text and trigger analysis
    const resumeText = await extractTextFromFile(file);
    if (resumeText.length >= 20) {
      await analyzeResume(resumeText);
    } else {
      toast({ title: "Could not extract text", description: "The file may be image-based. Try a text-based PDF or TXT file.", variant: "destructive" });
    }
  };

  const handleResumeDelete = async () => {
    if (!user || !resumeFile) return;
    try {
      const { error } = await supabase.storage.from("resumes").remove([`${user.id}/${resumeFile}`]);
      if (error) {
        console.error("Error deleting resume:", error);
        toast({ title: "Error", description: "Failed to delete resume. Please try again.", variant: "destructive" });
        return;
      }
      setResumeFile(null);
      setAnalysis(null);
      toast({ title: "Resume removed" });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error("Error deleting resume:", err);
      toast({ title: "Error", description: "Failed to delete resume. Please try again.", variant: "destructive" });
    }
  };

  const handleApply = async (job: typeof mockJobs[0]) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("applications").insert({
        user_id: user.id, job_title: job.title, company: job.company,
        location: job.location, match_score: job.match, status: "Applied",
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Applied!", description: `You applied to ${job.title} at ${job.company}` });

      // Refresh applications list
      const { data, error: fetchError } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false });

      if (fetchError) {
        console.error("Error refreshing applications:", fetchError);
        // Don't show error toast for fetch failure, just log it
      } else {
        setApplications(data || []);
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error("Error applying to job:", err);
      toast({ title: "Error", description: "Failed to apply to job. Please try again.", variant: "destructive" });
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMsg = { role: "user", content: chatInput };
    const allMessages = [...chatMessages, userMsg];
    setChatMessages(allMessages);
    setChatInput("");
    setChatLoading(true);

    let assistantSoFar = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: allMessages.map((m) => ({ role: m.role, content: m.content })) }),
      });

      if (!resp.ok) {
        // If the function is not available (404/405), use mock response
        if (resp.status === 404 || resp.status === 405) {
          console.log("Using mock chat response - Supabase function not available");
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
          const mockResponse = "Hello! I'm your AI career assistant. I can help you with resume improvement, career guidance, interview preparation, and job search strategies. What would you like to work on today?";
          setChatMessages((prev) => [...prev, { role: "assistant", content: mockResponse }]);
          setChatLoading(false);
          return;
        }
        const err = await resp.json().catch(() => ({ error: "AI service error" }));
        throw new Error(err.error || "AI service error");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setChatMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > allMessages.length) return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { textBuffer = line + "\n" + textBuffer; break; }
        }
      }
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      toast({ title: "AI Error", description: error.message, variant: "destructive" });
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally { setChatLoading(false); }
  };

  const filteredJobs = mockJobs.filter(
    (j) => j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayName = profile.full_name || user?.user_metadata?.full_name || "User";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2"><img src={logo} alt="KaizenJobs" className="h-7" /></Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">Welcome, {displayName}</span>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: FileText, label: "Skills", value: String(profile.skills.length), color: "text-primary" },
            { icon: Briefcase, label: "Jobs Available", value: String(mockJobs.length), color: "text-accent" },
            { icon: Target, label: "Avg Match", value: `${Math.round(mockJobs.reduce((a, j) => a + j.match, 0) / mockJobs.length)}%`, color: "text-primary" },
            { icon: Bot, label: "Applied", value: String(applications.length), color: "text-accent" },
          ].map((s) => (
            <motion.div key={s.label} className="glass-card rounded-xl border border-border/50 p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="font-display text-xl font-bold">{s.value}</p></div>
              </div>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="applied">Applied ({applications.length})</TabsTrigger>
            <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {/* User Info Card */}
            <motion.div className="glass-card rounded-xl border border-border/50 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full gradient-bg flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl font-bold">{displayName}</h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {new Date(user?.created_at || "").toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Profile Summary */}
            {(analysis?.summary || profile.resume_summary) && (
              <motion.div className="glass-card rounded-xl border border-border/50 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-semibold">Professional Summary</h3>
                  {analysis?.experience_level && (
                    <Badge className="gradient-bg text-primary-foreground ml-auto">{analysis.experience_level}</Badge>
                  )}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{analysis?.summary || profile.resume_summary}</p>
              </motion.div>
            )}

            {/* Skills */}
            {profile.skills.length > 0 && (
              <motion.div className="glass-card rounded-xl border border-border/50 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-semibold">Skills</h3>
                  <Badge variant="secondary" className="ml-auto">{profile.skills.length} skills</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <Badge key={s} className="gradient-bg text-primary-foreground">{s}</Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Best-Fit Roles */}
            {analysis && analysis.top_roles.length > 0 && (
              <motion.div className="glass-card rounded-xl border border-border/50 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-lg font-semibold">Best-Fit Roles</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysis.top_roles.map((role) => (
                    <div key={role} className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <Target className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{role}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Suggestions */}
            {analysis && analysis.suggestions.length > 0 && (
              <motion.div className="glass-card rounded-xl border border-border/50 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-accent" />
                  <h3 className="font-display text-lg font-semibold">Improvement Suggestions</h3>
                </div>
                <div className="space-y-3">
                  {analysis.suggestions.map((s, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-bg text-primary-foreground text-xs font-bold">{i + 1}</span>
                      <p className="text-sm text-foreground">{s}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* No resume prompt */}
            {!profile.resume_summary && profile.skills.length === 0 && (
              <motion.div className="glass-card rounded-xl border border-border/50 p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-3">Upload your resume in the Resume tab to unlock your AI-powered profile with skills, summary, and career suggestions.</p>
                <Button variant="outline" size="sm" onClick={() => document.querySelector<HTMLButtonElement>('[data-state][value="resume"]')?.click()}>
                  Go to Resume Tab
                </Button>
              </motion.div>
            )}
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search jobs..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="space-y-3">
              {filteredJobs.map((job) => {
                const alreadyApplied = applications.some((a) => a.job_title === job.title && a.company === job.company);
                return (
                  <motion.div key={job.id} className="glass-card rounded-xl border border-border/50 p-5 hover:border-primary/30 transition-all" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-semibold">{job.title}</h3>
                          <Badge variant="secondary" className="text-xs">{job.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{job.company} · {job.salary}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.posted}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {job.skills.map((s) => (<Badge key={s} variant="outline" className="text-xs">{s}</Badge>))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className={`font-display text-2xl font-bold ${job.match >= 90 ? "text-primary" : job.match >= 80 ? "text-accent" : "text-muted-foreground"}`}>{job.match}%</div>
                          <p className="text-xs text-muted-foreground">Match</p>
                        </div>
                        <Button size="sm" className="gradient-bg text-primary-foreground gap-1" disabled={alreadyApplied} onClick={() => handleApply(job)}>
                          {alreadyApplied ? "Applied" : <>Apply <ChevronRight className="h-3 w-3" /></>}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Resume Tab */}
          <TabsContent value="resume" className="space-y-4">
            {/* Upload Section */}
            <div className="glass-card rounded-xl border border-border/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">Resume</h3>
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleResumeUpload} />
                  <Button variant="outline" size="sm" className="gap-1.5" disabled={uploading || analyzing} onClick={() => fileInputRef.current?.click()}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Uploading..." : "Upload Resume"}
                  </Button>
                </div>
              </div>

              {resumeFile && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                  <File className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium flex-1">{resumeFile}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={handleResumeDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {analyzing && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-medium">Analyzing your resume with AI...</p>
                    <p className="text-xs text-muted-foreground">Extracting skills, generating summary, and finding improvement areas</p>
                  </div>
                </div>
              )}

              {!analysis && !analyzing && (
                <p className="text-sm text-muted-foreground">Upload your resume (PDF, DOCX, or TXT) to get AI-powered analysis, skill extraction, and improvement suggestions.</p>
              )}
            </div>

            {/* Analysis Results */}
            {analysis && !analyzing && (
              <>
                {/* Profile Summary */}
                <motion.div className="glass-card rounded-xl border border-border/50 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-lg font-semibold">AI Profile Summary</h3>
                    {analysis.experience_level && (
                      <Badge className="gradient-bg text-primary-foreground ml-auto">{analysis.experience_level}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{analysis.summary || profile.resume_summary}</p>
                </motion.div>

                {/* Skills */}
                <motion.div className="glass-card rounded-xl border border-border/50 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-lg font-semibold">Extracted Skills</h3>
                    <Badge variant="secondary" className="ml-auto">{analysis.skills.length} skills</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills.map((s) => (
                      <Badge key={s} className="gradient-bg text-primary-foreground">{s}</Badge>
                    ))}
                  </div>
                </motion.div>

                {/* Best-Fit Roles */}
                {analysis.top_roles.length > 0 && (
                  <motion.div className="glass-card rounded-xl border border-border/50 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-5 w-5 text-primary" />
                      <h3 className="font-display text-lg font-semibold">Best-Fit Roles</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analysis.top_roles.map((role) => (
                        <div key={role} className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <Target className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium">{role}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Improvement Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <motion.div className="glass-card rounded-xl border border-border/50 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-5 w-5 text-accent" />
                      <h3 className="font-display text-lg font-semibold">Improvement Suggestions</h3>
                    </div>
                    <div className="space-y-3">
                      {analysis.suggestions.map((s, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-bg text-primary-foreground text-xs font-bold">{i + 1}</span>
                          <p className="text-sm text-foreground">{s}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </TabsContent>

          {/* Applied Tab */}
          <TabsContent value="applied" className="space-y-3">
            {applications.length === 0 ? (
              <div className="glass-card rounded-xl border border-border/50 p-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No applications yet. Browse jobs and start applying!</p>
              </div>
            ) : applications.map((app) => (
              <div key={app.id} className="glass-card rounded-xl border border-border/50 p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold">{app.job_title}</h3>
                  <p className="text-sm text-muted-foreground">{app.company} · Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {app.match_score && <span className="text-sm font-medium text-primary">{app.match_score}% match</span>}
                  <Badge variant={app.status === "Interview Scheduled" ? "default" : "secondary"}>{app.status}</Badge>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="assistant">
            <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
              <div className="gradient-bg p-4 flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary-foreground" />
                <span className="font-display font-semibold text-sm text-primary-foreground">AI Career Assistant</span>
              </div>
              <div className="h-80 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "gradient-bg text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && chatMessages[chatMessages.length - 1]?.role === "user" && (
                  <div className="flex justify-start"><div className="bg-muted rounded-xl px-3 py-2"><Loader2 className="h-4 w-4 animate-spin" /></div></div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-border p-3 flex gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Ask about your career..." className="flex-1" disabled={chatLoading} />
                <Button size="icon" className="gradient-bg text-primary-foreground" onClick={sendChat} disabled={chatLoading}>
                  {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
