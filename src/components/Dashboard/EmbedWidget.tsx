import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Code, Copy, Check, Globe, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmbedWidgetProps {
  embedKey: string;
  botName: string;
  isActive: boolean;
}

export function EmbedWidget({ embedKey, botName, isActive }: EmbedWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const embedSnippet = useMemo(() => {
    return `<!-- Servio Support Widget -->
<script 
  src="https://servio-green.lovable.app/widget.js" 
  data-embed-key="${embedKey}"
  async>
</script>`;
  }, [embedKey]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopied(true);
      toast.success("Embed code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  }, [embedSnippet]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Website Widget</CardTitle>
              <CardDescription>
                Embed the chat widget on your website
              </CardDescription>
            </div>
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Embed Key</span>
              <code className="text-xs bg-background px-2 py-1 rounded border">
                {embedKey.slice(0, 8)}...{embedKey.slice(-4)}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              This key identifies your bot "{botName}" on your website
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Code className="w-4 h-4 mr-2" />
                Get Embed Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Website Widget Installation</DialogTitle>
                <DialogDescription>
                  Copy this code and paste it into your website's HTML, just before the closing &lt;/body&gt; tag.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{embedSnippet}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Step 1: Copy the code</h4>
                    <p className="text-muted-foreground text-xs">
                      Click the "Copy" button above to copy the embed code.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Step 2: Paste in your website</h4>
                    <p className="text-muted-foreground text-xs">
                      Add the code just before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag in your HTML.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Step 3: Test it out</h4>
                    <p className="text-muted-foreground text-xs">
                      Refresh your website and you should see the chat widget in the bottom-right corner.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm mb-1">Works with any website</h4>
                      <p className="text-xs text-muted-foreground">
                        HTML, WordPress, Shopify, Webflow, Squarespace, Wix, React, Next.js, and more!
                        Just add the script tag and the widget will appear automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-medium">Features:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>No manual configuration required</li>
              <li>Automatically loads your bot settings</li>
              <li>Works on any website platform</li>
              <li>Fully customizable appearance</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
