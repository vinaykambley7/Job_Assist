// Deno type declarations for Supabase Edge Functions
declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

// Web API types
declare interface Request extends globalThis.Request {}
declare interface Response extends globalThis.Response {}

// Supabase types
declare module "https://esm.sh/@supabase/supabase-js@2.103.0" {
  export * from "@supabase/supabase-js";
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export * from "https://deno.land/std@0.168.0/http/server.ts";
}