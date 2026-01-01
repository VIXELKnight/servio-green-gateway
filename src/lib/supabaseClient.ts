// Wrapper export to ensure the app uses the Lovable Cloud client configuration.
// Avoid creating separate clients with custom env vars, as that can break auth/session refresh.
export { supabase } from "@/integrations/supabase/client";
