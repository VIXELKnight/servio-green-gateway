import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, AlertTriangle, Sparkles, Zap, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Plan configuration matching Stripe products
interface Plan {
  id: string;
  name: string;
  priceId: string | null;
  productId: string | null;
  price: number | null;
  description: string;
  icon: typeof Sparkles;
  popular?: boolean;
  features: string[];
}

const PLANS: Record<string, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceId: "price_1SdJxjBBqKy6E8PpMZcsz08f",
    productId: "prod_TaUxKd7nC9V8he",
    price: 49,
    description: "Perfect for small businesses",
    icon: Sparkles,
    features: [
      "Up to 500 support tickets/month",
      "Basic chatbot automation",
      "Email support",
      "1 AI Bot",
      "Web widget channel",
    ],
  },
  professional: {
    id: "professional",
    name: "Professional",
    priceId: "price_1SdJy0BBqKy6E8PpIyUGyD2Q",
    productId: "prod_TaUxWjLTJMYkpU",
    price: 149,
    description: "For growing teams",
    icon: Zap,
    popular: true,
    features: [
      "Up to 2,500 support tickets/month",
      "Advanced AI automation",
      "Priority support",
      "AI inbox management",
      "5 AI Bots",
      "All channels (Web, WhatsApp, Instagram)",
      "Analytics dashboard",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceId: null,
    productId: null,
    price: null,
    description: "For large organizations",
    icon: Building2,
    features: [
      "Unlimited support tickets",
      "Custom AI training",
      "Dedicated account manager",
      "24/7 phone support",
      "Unlimited AI Bots",
      "All channels + custom integrations",
      "Advanced analytics & reporting",
      "SLA guarantees",
      "White-label options",
    ],
  },
};

interface SubscriptionManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProductId?: string | null;
  isSubscribed?: boolean;
  onSubscriptionChange?: () => void;
}

export function SubscriptionManagementModal({
  open,
  onOpenChange,
  currentProductId,
  isSubscribed,
  onSubscriptionChange,
}: SubscriptionManagementModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Determine current plan
  const getCurrentPlan = () => {
    if (!currentProductId) return null;
    return Object.values(PLANS).find(p => p.productId === currentProductId)?.id || null;
  };

  const currentPlan = getCurrentPlan();

  const handleSelectPlan = async (planId: string) => {
    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan.priceId) {
      // Enterprise - contact sales
      window.open("mailto:sales@servio.com?subject=Enterprise Plan Inquiry", "_blank");
      return;
    }

    if (planId === currentPlan) return;

    setLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: plan.priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { cancel_at_period_end: true },
      });

      if (error) throw error;

      toast.success(data?.message || "Subscription will be cancelled at the end of your billing period");
      setShowCancelConfirm(false);
      onOpenChange(false);
      onSubscriptionChange?.();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const getPlanStatus = (planId: string) => {
    if (planId === currentPlan) return "current";
    if (!currentPlan) return "available";
    
    const planOrder = ["starter", "professional", "enterprise"];
    const currentIndex = planOrder.indexOf(currentPlan);
    const targetIndex = planOrder.indexOf(planId);
    
    if (targetIndex > currentIndex) return "upgrade";
    return "downgrade";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Subscription</DialogTitle>
          <DialogDescription>
            Choose the plan that best fits your needs. Upgrade, downgrade, or cancel anytime.
          </DialogDescription>
        </DialogHeader>

        {showCancelConfirm ? (
          <div className="py-6">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Cancel your subscription?</h3>
                <p className="text-muted-foreground">
                  Your subscription will remain active until the end of your current billing period. 
                  After that, you'll lose access to premium features.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                  >
                    {cancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Yes, Cancel Subscription
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                  >
                    Keep My Plan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              {Object.entries(PLANS).map(([key, plan]) => {
                const status = getPlanStatus(key);
                const Icon = plan.icon;
                const isCurrentPlan = status === "current";
                const isLoading = loading === key;

                return (
                  <div
                    key={key}
                    className={cn(
                      "relative flex flex-col p-5 rounded-xl border-2 transition-all",
                      isCurrentPlan && "border-primary bg-primary/5",
                      !isCurrentPlan && "border-border hover:border-primary/50",
                      plan.popular && !isCurrentPlan && "border-primary/30"
                    )}
                  >
                    {plan.popular && !isCurrentPlan && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary">
                        Most Popular
                      </Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500">
                        Current Plan
                      </Badge>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isCurrentPlan ? "bg-primary/20" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          isCurrentPlan ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      {plan.price ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold">Custom</div>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSelectPlan(key)}
                      disabled={isCurrentPlan || isLoading}
                      variant={isCurrentPlan ? "outline" : status === "upgrade" ? "default" : "outline"}
                      className="w-full"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {isCurrentPlan
                        ? "Current Plan"
                        : !plan.priceId
                        ? "Contact Sales"
                        : status === "upgrade"
                        ? "Upgrade"
                        : "Switch Plan"}
                    </Button>
                  </div>
                );
              })}
            </div>

            {isSubscribed && (
              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel Subscription
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
