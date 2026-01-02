import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-REPLY] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's token to get user info
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      logStep("ERROR: Auth failed", { error: authError?.message });
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is admin using service role client (bypasses RLS)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData || roleData.role !== 'admin') {
      logStep("ERROR: User is not admin", { userId: user.id });
      return new Response(JSON.stringify({ error: 'Forbidden: requires admin role' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    logStep("Admin role verified");

    // Parse request body
    const { submissionId, to_email, subject, body } = await req.json();
    logStep("Request parsed", { submissionId, to_email, subject });

    if (!submissionId || !to_email || !subject || !body) {
      logStep("ERROR: Missing required fields");
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to_email)) {
      logStep("ERROR: Invalid email format", { to_email });
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email via Resend if API key is configured
    if (resendApiKey) {
      logStep("Sending email via Resend");
      const resend = new Resend(resendApiKey);
      
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Servio Support <onboarding@resend.dev>',
        to: [to_email],
        subject: subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Servio Support</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${body}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This email was sent by Servio Support Team.<br />
                If you have any questions, feel free to reply to this email.
              </p>
            </div>
          </div>
        `,
      });

      if (emailError) {
        logStep("ERROR: Resend failed", { error: emailError.message });
        return new Response(JSON.stringify({ error: 'Failed to send email: ' + emailError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      logStep("Email sent successfully", { emailId: emailData?.id, to: to_email });
    } else {
      logStep("WARNING: Resend not configured, skipping email", { to: to_email });
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('contact_submissions')
      .update({
        status: 'responded',
        responded_at: new Date().toISOString(),
        responded_by: user.id,
        reply_channel: 'email',
        reply_body: body,
      })
      .eq('id', submissionId);

    if (updateError) {
      logStep("ERROR: Failed to update submission", { error: updateError.message });
      return new Response(JSON.stringify({ error: 'Failed to update submission status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("Reply completed successfully", { submissionId });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logStep("ERROR: Unexpected error", { message: errorMessage });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
