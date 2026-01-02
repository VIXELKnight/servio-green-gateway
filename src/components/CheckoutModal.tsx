import { useState, useCallback, useEffect } from "react";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripeClient";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchClientSecret = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-embedded-checkout",
        {
          body: { priceId },
        }
      );

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      if (!data?.clientSecret) throw new Error("No client secret returned");

      setClientSecret(data.clientSecret);
      return data.clientSecret;
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to initialize checkout");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [priceId]);

  useEffect(() => {
    if (isOpen && !clientSecret && !loading) {
      fetchClientSecret();
    }
  }, [isOpen, clientSecret, loading, fetchClientSecret]);

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setError(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-semibold">
            Subscribe to {planName}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 min-h-[500px]">
          {loading && (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Preparing checkout...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive text-xl">!</span>
              </div>
              <p className="text-destructive font-medium">Checkout Error</p>
              <p className="text-muted-foreground text-sm max-w-md">{error}</p>
            </div>
          )}

          {clientSecret && !loading && !error && (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
