import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Check for trialing subscriptions too
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      
      if (trialingSubscriptions.data.length === 0) {
        throw new Error("No active subscription found");
      }
      
      // Cancel trialing subscription
      const subscription = trialingSubscriptions.data[0];
      await stripe.subscriptions.cancel(subscription.id);
      logStep("Trialing subscription cancelled", { subscriptionId: subscription.id });
      
      return new Response(JSON.stringify({ success: true, message: "Subscription cancelled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Cancel at period end (graceful cancellation)
    const subscription = subscriptions.data[0];
    const { cancel_at_period_end } = await req.json().catch(() => ({ cancel_at_period_end: true }));
    
    if (cancel_at_period_end) {
      // Cancel at end of billing period
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });
      logStep("Subscription set to cancel at period end", { subscriptionId: subscription.id });
    } else {
      // Immediate cancellation
      await stripe.subscriptions.cancel(subscription.id);
      logStep("Subscription cancelled immediately", { subscriptionId: subscription.id });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: cancel_at_period_end 
        ? "Subscription will be cancelled at the end of the billing period" 
        : "Subscription cancelled immediately"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
