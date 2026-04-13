import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { resumeText } = await req.json();
    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Resume text too short or missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional resume analyst. Analyze the resume and extract structured data. You MUST call the analyze_resume function with the results.`
          },
          {
            role: "user",
            content: `Analyze this resume:\n\n${resumeText.slice(0, 8000)}`
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_resume",
              description: "Return structured resume analysis with skills, summary, and suggestions.",
              parameters: {
                type: "object",
                properties: {
                  skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of technical and soft skills extracted from the resume"
                  },
                  summary: {
                    type: "string",
                    description: "A 2-3 sentence professional summary of the candidate based on their resume"
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 actionable improvement suggestions for the resume"
                  },
                  experience_level: {
                    type: "string",
                    enum: ["Entry Level", "Mid Level", "Senior", "Lead/Principal"],
                    description: "Estimated experience level"
                  },
                  top_roles: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 job roles best suited for this candidate"
                  }
                },
                required: ["skills", "summary", "suggestions", "experience_level", "top_roles"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_resume" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("AI did not return structured data");

    const analysis = JSON.parse(toolCall.function.arguments);

    // Update user profile with extracted data
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        skills: analysis.skills,
        resume_summary: analysis.summary,
        resume_text: resumeText.slice(0, 50000),
      })
      .eq("user_id", user.id);

    if (updateError) console.error("Profile update error:", updateError);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
