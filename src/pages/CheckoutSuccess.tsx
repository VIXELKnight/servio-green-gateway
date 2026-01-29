import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, checkSubscription, isSubscribed, currentPlan } = useAuth();
  const [refreshing, setRefreshing] = useState(true);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const isCanceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Auto-refresh subscription status
  useEffect(() => {
    if (isCanceled || !user) return;

    const refreshStatus = async () => {
      setRefreshing(true);
      await checkSubscription();
      setRefreshAttempts((prev) => prev + 1);
    };

    refreshStatus();

    // Poll every 2 seconds for up to 10 attempts (20 seconds total)
    const interval = setInterval(() => {
      if (refreshAttempts >= 10) {
        clearInterval(interval);
        setRefreshing(false);
        return;
      }
      refreshStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [user, isCanceled]);

  // Confirm once subscription is detected
  useEffect(() => {
    if (isSubscribed && !confirmed) {
      setConfirmed(true);
      setRefreshing(false);
    }
  }, [isSubscribed, confirmed]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isCanceled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Checkout Canceled</h1>
              <p className="text-muted-foreground">
                No worries! You can upgrade anytime from your dashboard.
              </p>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPlanLabel = () => {
    if (currentPlan === "starter") return "Starter";
    if (currentPlan === "professional") return "Professional";
    return "Pro";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full overflow-hidden">
        {/* Success header with gradient */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 text-center">
          <div
            className={cn(
              "w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all duration-500",
              confirmed
                ? "bg-emerald-500/20 scale-100"
                : "bg-primary/20 scale-95"
            )}
          >
            {refreshing && !confirmed ? (
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            )}
          </div>
        </div>

        <CardContent className="pt-6 pb-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {confirmed ? "Welcome to Servio!" : "Processing..."}
            </h1>
            <p className="text-muted-foreground">
              {confirmed
                ? `You're now on the ${getPlanLabel()} plan. Your AI-powered support journey begins now.`
                : "Confirming your subscription status..."}
            </p>
          </div>

          {confirmed && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary font-medium">
                <Sparkles className="w-4 h-4" />
                <span>{getPlanLabel()} Plan Activated</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You now have access to all {getPlanLabel()} features including AI bots, 
                multi-channel support, and more.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full"
              size="lg"
              disabled={refreshing && !confirmed}
            >
              {refreshing && !confirmed ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {!confirmed && refreshAttempts >= 5 && (
              <p className="text-xs text-muted-foreground">
                Taking longer than expected? Your subscription may take a moment to activate.{" "}
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-primary hover:underline"
                >
                  Continue anyway
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;
