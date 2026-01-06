import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShoppingBag, Settings, Check, AlertCircle, Loader2, ExternalLink } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    store_domain: "",
    access_token: "",
    is_active: true
  });

  useEffect(() => {
    fetchConfig();
  }, [botId]);

  async function fetchConfig() {
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
      setFormData({
        store_domain: data.store_domain,
        access_token: data.access_token,
        is_active: data.is_active
      });
    }
    setIsLoading(false);
  }

  async function saveConfig() {
    if (!formData.store_domain.trim() || !formData.access_token.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Clean up store domain
    let cleanDomain = formData.store_domain.trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    
    if (!cleanDomain.includes('.myshopify.com')) {
      cleanDomain = `${cleanDomain}.myshopify.com`;
    }

    setIsSaving(true);
    
    if (config) {
      // Update existing
      const { error } = await supabase
        .from("bot_shopify_integrations")
        .update({
          store_domain: cleanDomain,
          access_token: formData.access_token.trim(),
          is_active: formData.is_active
        })
        .eq("id", config.id);

      if (error) {
        console.error("Error updating Shopify config:", error);
        toast.error("Failed to update Shopify integration");
      } else {
        toast.success("Shopify integration updated");
        setIsDialogOpen(false);
        fetchConfig();
      }
    } else {
      // Create new
      const { error } = await supabase
        .from("bot_shopify_integrations")
        .insert({
          bot_id: botId,
          store_domain: cleanDomain,
          access_token: formData.access_token.trim(),
          is_active: formData.is_active
        });

      if (error) {
        console.error("Error creating Shopify config:", error);
        toast.error("Failed to connect Shopify store");
      } else {
        toast.success("Shopify store connected");
        setIsDialogOpen(false);
        fetchConfig();
      }
    }
    
    setIsSaving(false);
  }

  async function toggleActive(isActive: boolean) {
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
  }

  async function testConnection() {
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
  }

  async function disconnectShopify() {
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
      setFormData({ store_domain: "", access_token: "", is_active: true });
    }
  }

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
                    Configure
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Shopify Configuration</DialogTitle>
                    <DialogDescription>
                      Update your Shopify store connection settings
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="store-domain">Store Domain</Label>
                      <Input
                        id="store-domain"
                        value={formData.store_domain}
                        onChange={(e) => setFormData({ ...formData, store_domain: e.target.value })}
                        placeholder="your-store.myshopify.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="access-token">Admin API Access Token</Label>
                      <Input
                        id="access-token"
                        type="password"
                        value={formData.access_token}
                        onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                        placeholder="shpat_..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        <a 
                          href="https://help.shopify.com/en/manual/apps/app-types/custom-apps" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Learn how to create an access token
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Enable Integration</Label>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="destructive" onClick={disconnectShopify}>
                      Disconnect
                    </Button>
                    <Button onClick={saveConfig} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Save Changes
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
              Enable your bot to access order and product information
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Connect Shopify
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Shopify Store</DialogTitle>
                  <DialogDescription>
                    Enter your Shopify store details to enable order tracking and product info
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="store-domain-new">Store Domain</Label>
                    <Input
                      id="store-domain-new"
                      value={formData.store_domain}
                      onChange={(e) => setFormData({ ...formData, store_domain: e.target.value })}
                      placeholder="your-store.myshopify.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your store name or full myshopify.com domain
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="access-token-new">Admin API Access Token</Label>
                    <Input
                      id="access-token-new"
                      type="password"
                      value={formData.access_token}
                      onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                      placeholder="shpat_..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      <a 
                        href="https://help.shopify.com/en/manual/apps/app-types/custom-apps" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Learn how to create an access token
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your access token requires read access to Orders and Products
                    </AlertDescription>
                  </Alert>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveConfig} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Connect Store
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
