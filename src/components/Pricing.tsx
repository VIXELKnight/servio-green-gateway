import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PLANS } from "@/lib/stripe";
import CheckoutModal from "@/components/CheckoutModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const plans = [
  {
    key: "starter" as const,
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small businesses getting started with AI support",
    features: [
      "Up to 500 conversations/month",
      "1 AI Bot",
      "Website widget",
      "Basic analytics",
      "Email support",
      "5 knowledge base articles",
    ],
    popular: false,
    icon: Zap,
  },
  {
    key: "professional" as const,
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "For growing teams that need multi-channel automation",
    features: [
      "Up to 2,500 conversations/month",
      "5 AI Bots",
      "Website, WhatsApp & Instagram",
      "Advanced analytics & reporting",
      "Priority support",
      "Unlimited knowledge base",
      "Custom bot training",
      "Auto-triage & escalation",
    ],
    popular: true,
    icon: Sparkles,
  },
  {
    key: "enterprise" as const,
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large organizations",
    features: [
      "Unlimited conversations",
      "Unlimited AI Bots",
      "All channels + API access",
      "24/7 dedicated support",
      "Custom integrations",
      "SLA guarantees",
      "Dedicated account manager",
      "On-premise deployment option",
      "SSO & advanced security",
    ],
    popular: false,
    icon: Crown,
  },
];

const Pricing = () => {
  const { user, currentPlan, isSubscribed, checkSubscription } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ key: string; name: string; priceId: string } | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubscribe = async (planKey: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (planKey === "enterprise") {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const plan = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS];
    if (!plan) return;

    setSelectedPlan({ key: planKey, name: plan.name, priceId: plan.price_id });
    setCheckoutOpen(true);
  };

  const handleCloseCheckout = () => {
    setCheckoutOpen(false);
    setSelectedPlan(null);
  };

  const handleCancelSubscription = async () => {
    setCancellingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { cancel_at_period_end: true }
      });
      if (error) throw error;
      
      toast({
        title: "Subscription Cancelled",
        description: data.message || "Your subscription will be cancelled at the end of the billing period.",
      });
      
      // Refresh subscription status
      await checkSubscription();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setCancellingSubscription(false);
      setShowCancelDialog(false);
    }
  };

  return (
    <section id="pricing" className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold uppercase tracking-wider mb-4">
            <Crown className="w-4 h-4" />
            Pricing Plans
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Simple, Transparent
            <span className="text-gradient"> Pricing</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Choose the plan that fits your business needs. Start free, upgrade when you're ready.
            All plans include a 3-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.key;
            const PlanIcon = plan.icon;
            
            return (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular
                    ? "bg-primary text-primary-foreground shadow-2xl scale-105 lg:scale-110 z-10"
                    : "bg-card border border-border hover:border-primary/30 hover:shadow-xl"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-green-200 text-primary rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4 px-3 py-1 bg-green-100 text-primary rounded-full text-xs font-semibold flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Your Plan
                  </div>
                )}

                {/* Plan icon */}
                <div className={`w-12 h-12 rounded-xl ${plan.popular ? 'bg-primary-foreground/20' : 'bg-primary/10'} flex items-center justify-center mb-6`}>
                  <PlanIcon className={`w-6 h-6 ${plan.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                </div>

                {/* Plan name */}
                <h3 className={`text-xl font-bold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mt-4 mb-2">
                  <span className={`text-4xl font-extrabold ${plan.popular ? "text-primary-foreground" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  <span className={plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}>
                    {plan.period}
                  </span>
                </div>

                {/* Description */}
                <p className={`text-sm mb-6 ${plan.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.popular ? "text-green-200" : "text-primary"}`} />
                      <span className={plan.popular ? "text-primary-foreground/90" : "text-foreground/80"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {isCurrentPlan && isSubscribed ? (
                  <Button
                    variant={plan.popular ? "heroOutline" : "destructive"}
                    size="lg"
                    className="w-full"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancel Subscription
                  </Button>
                ) : (
                  <Button
                    variant={plan.popular ? "hero" : "default"}
                    size="lg"
                    className="w-full"
                    onClick={() => handleSubscribe(plan.key)}
                  >
                    {plan.key === "enterprise" ? "Contact Sales" : "Start Free Trial"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Money back guarantee */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            ✓ 3-day free trial • ✓ No credit card required • ✓ Cancel anytime
          </p>
        </div>

        {/* Embedded Checkout Modal */}
        {selectedPlan && (
          <CheckoutModal
            isOpen={checkoutOpen}
            onClose={handleCloseCheckout}
            priceId={selectedPlan.priceId}
            planName={selectedPlan.name}
          />
        )}

        {/* Cancel Subscription Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
              <AlertDialogDescription>
                Your subscription will remain active until the end of your current billing period. 
                After that, you'll lose access to premium features.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancellingSubscription}>
                Keep Subscription
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancellingSubscription ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
};

export default Pricing;
