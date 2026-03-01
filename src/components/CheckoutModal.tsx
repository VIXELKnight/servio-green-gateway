import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceId: string;
  planName: string;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  priceId,
  planName,
}: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-checkout",
        { body: { priceId } }
      );

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("No checkout URL returned");

      // Redirect to Stripe hosted checkout
      window.open(data.url, "_blank", "noopener,noreferrer");
      onClose();
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Subscribe to {planName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-sm">
            You'll be redirected to a secure Stripe checkout page to complete your subscription.
            All plans include a 3-day free trial.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing checkout...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Continue to Checkout
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
