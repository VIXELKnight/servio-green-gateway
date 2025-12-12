import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PLANS } from "@/lib/stripe";

const plans = [
  {
    key: "starter" as const,
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small businesses getting started",
    features: [
      "Up to 500 support tickets/month",
      "Basic chatbot automation",
      "Email support",
      "Standard response time",
      "Basic analytics",
    ],
    popular: false,
  },
  {
    key: "professional" as const,
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "For growing teams that need more power",
    features: [
      "Up to 2,500 support tickets/month",
      "Advanced AI automation",
      "Priority email & chat support",
      "AI inbox management",
      "Advanced analytics & reporting",
      "Custom chatbot training",
    ],
    popular: true,
  },
  {
    key: "enterprise" as const,
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large organizations",
    features: [
      "Unlimited support tickets",
      "Full AI suite access",
      "24/7 dedicated support",
      "Custom integrations",
      "SLA guarantees",
      "Dedicated account manager",
      "On-premise deployment option",
    ],
    popular: false,
  },
];

const Pricing = () => {
  const { user, currentPlan, isSubscribed } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
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

    setLoadingPlan(planKey);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: plan.price_id },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open portal",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="pricing" className="py-24 md:py-32 bg-secondary/50">
      <div className="container px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Pricing</span>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Simple, Transparent
            <span className="text-gradient"> Pricing</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your business needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.key;
            
            return (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular
                    ? "bg-primary text-primary-foreground shadow-glow scale-105 md:scale-110"
                    : "bg-card border border-border hover:border-primary/30 hover:shadow-xl"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-200 text-primary rounded-full text-sm font-semibold">
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
                    variant={plan.popular ? "hero" : "outline"}
                    size="lg"
                    className="w-full"
                    onClick={handleManageSubscription}
                  >
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    variant={plan.popular ? "hero" : "default"}
                    size="lg"
                    className="w-full"
                    onClick={() => handleSubscribe(plan.key)}
                    disabled={loadingPlan === plan.key}
                  >
                    {loadingPlan === plan.key
                      ? "Loading..."
                      : plan.key === "enterprise"
                      ? "Contact Sales"
                      : "Get Started"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
