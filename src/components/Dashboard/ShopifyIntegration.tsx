import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingBag, Settings, Check, AlertCircle, Loader2, ExternalLink, Link2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShopifyIntegrationProps {
  botId: string;
}

interface ShopifyConfig {
  id: string;
  store_domain: string;
  access_token: string;
  is_active: boolean;
}

export function ShopifyIntegration({ botId }: ShopifyIntegrationProps) {
  const [config, setConfig] = useState<ShopifyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [storeDomain, setStoreDomain] = useState("");

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("bot_shopify_integrations")
      .select("*")
      .eq("bot_id", botId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching Shopify config:", error);
    }
    
    if (data) {
      setConfig(data);
    }
    setIsLoading(false);
  }, [botId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Check for OAuth callback success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("shopify") === "connected") {
      toast.success("Shopify store connected successfully!");
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchConfig();
    }
  }, [fetchConfig]);

  const startOAuthFlow = useCallback(async () => {
    if (!storeDomain.trim()) {
      toast.error("Please enter your Shopify store domain");
      return;
    }

    setIsConnecting(true);

    try {
      const { data, error } = await supabase.functions.invoke("shopify-oauth-start", {
        body: { 
          bot_id: botId, 
          shop_domain: storeDomain.trim() 
        }
      });

      if (error) throw error;

      if (data.authorization_url) {
        // Redirect to Shopify OAuth page
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No authorization URL received");
      }
    } catch (error) {
      console.error("OAuth start error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start Shopify connection");
      setIsConnecting(false);
    }
  }, [botId, storeDomain]);

  const toggleActive = useCallback(async (isActive: boolean) => {
    if (!config) return;

    const { error } = await supabase
      .from("bot_shopify_integrations")
      .update({ is_active: isActive })
      .eq("id", config.id);

    if (error) {
      console.error("Error toggling Shopify:", error);
      toast.error("Failed to update status");
    } else {
      toast.success(`Shopify integration ${isActive ? "enabled" : "disabled"}`);
      setConfig({ ...config, is_active: isActive });
    }
  }, [config]);

  const testConnection = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("shopify-test", {
        body: { bot_id: botId }
      });

      if (error) throw error;

      setTestResult({
        success: data.success,
        message: data.message || (data.success ? "Connection successful!" : "Connection failed")
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to test connection"
      });
    }

    setIsTesting(false);
  }, [botId]);

  const disconnectShopify = useCallback(async () => {
    if (!config) return;

    const { error } = await supabase
      .from("bot_shopify_integrations")
      .delete()
      .eq("id", config.id);

    if (error) {
      console.error("Error disconnecting Shopify:", error);
      toast.error("Failed to disconnect Shopify");
    } else {
      toast.success("Shopify disconnected");
      setConfig(null);
      setIsDialogOpen(false);
    }
  }, [config]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Shopify Integration</CardTitle>
              <CardDescription>
                Enable order tracking and product info in bot conversations
              </CardDescription>
            </div>
          </div>
          {config && (
            <Switch
              checked={config.is_active}
              onCheckedChange={toggleActive}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {config ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">Connected to Shopify</p>
                  <p className="text-sm text-muted-foreground">{config.store_domain}</p>
                </div>
              </div>
              <Badge variant={config.is_active ? "default" : "secondary"}>
                {config.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={testConnection} disabled={isTesting}>
                {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Test Connection
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Shopify Connection</DialogTitle>
                    <DialogDescription>
                      Your store is connected via secure OAuth
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Connected Store</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{config.store_domain}</p>
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        To reconnect with different permissions, disconnect first then connect again.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="destructive" onClick={disconnectShopify}>
                      Disconnect Store
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Your bot can now:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Look up order status by order number or email</li>
                <li>Provide shipping and tracking information</li>
                <li>Answer questions about product details and availability</li>
                <li>Check inventory and pricing</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-medium mb-2">Connect Your Shopify Store</h4>
            <p className="text-sm text-muted-foreground mb-4">
              One-click secure connection via Shopify OAuth — no API tokens needed
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Shopify Store
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Shopify Store</DialogTitle>
                  <DialogDescription>
                    Enter your store domain to start the secure OAuth connection
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="store-domain">Store Domain</Label>
                    <div className="flex mt-1.5">
                      <Input
                        id="store-domain"
                        value={storeDomain}
                        onChange={(e) => setStoreDomain(e.target.value)}
                        placeholder="your-store"
                        className="rounded-r-none"
                      />
                      <span className="inline-flex items-center px-3 bg-muted border border-l-0 border-input rounded-r-md text-sm text-muted-foreground">
                        .myshopify.com
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your store name (the part before .myshopify.com)
                    </p>
                  </div>
                  <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      You'll be redirected to Shopify to approve the connection. No manual tokens required!
                    </AlertDescription>
                  </Alert>
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Permissions requested:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Read orders and fulfillments</li>
                      <li>Read products and inventory</li>
                      <li>Read customer information</li>
                    </ul>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={startOAuthFlow} disabled={isConnecting || !storeDomain.trim()}>
                    {isConnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                    Connect to Shopify
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
