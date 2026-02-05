import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Shield, 
  CreditCard,
  ArrowRight,
  Palette,
  Monitor,
  Sun,
  Moon,
  Keyboard,
  Bell
} from "lucide-react";
import { useThemeContext } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { InvoiceHistory } from "./InvoiceHistory";
import { NotificationSettings } from "./NotificationSettings";
import { KeyboardShortcutsHelp } from "@/hooks/useKeyboardShortcuts";

interface SettingsViewProps {
  userEmail?: string;
  isSubscribed?: boolean;
  currentPlan?: string | null;
  subscriptionEnd?: string | null;
  onManageSubscription: () => void;
}

const dashboardShortcuts = [
  { key: "h", handler: () => {}, description: "Go to Home/Overview" },
  { key: "b", handler: () => {}, description: "Go to Bots" },
  { key: "a", handler: () => {}, description: "Go to Analytics" },
  { key: "s", handler: () => {}, description: "Go to Settings" },
  { key: "/", handler: () => {}, description: "Focus Search" },
  { key: "?", shift: true, handler: () => {}, description: "Show Help" },
];

export function SettingsView({ 
  userEmail, 
  isSubscribed,
  currentPlan,
  subscriptionEnd,
  onManageSubscription
}: SettingsViewProps) {
  const { theme, setTheme, isDark } = useThemeContext();

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <Tabs defaultValue="account" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      {/* Account Tab */}
      <TabsContent value="account" className="space-y-6 max-w-3xl">
        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" defaultValue={userEmail?.split("@")[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={userEmail} disabled />
              </div>
            </div>
            <Button size="sm">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Appearance</CardTitle>
                <CardDescription>Customize how Servio looks on your device</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                      theme === option.value 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <option.icon className={cn(
                      "w-5 h-5",
                      theme === option.value ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      theme === option.value ? "text-primary" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {theme === "system" 
                  ? `Using your system preference (currently ${isDark ? "dark" : "light"} mode)`
                  : `Using ${theme} mode`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Keyboard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
                <CardDescription>Navigate faster with keyboard shortcuts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <KeyboardShortcutsHelp shortcuts={dashboardShortcuts} />
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Security</CardTitle>
                <CardDescription>Protect your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-factor authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Change password</p>
                <p className="text-sm text-muted-foreground">Update your password regularly</p>
              </div>
              <Button variant="outline" size="sm">Change</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Billing Tab */}
      <TabsContent value="billing" className="space-y-6 max-w-3xl">
        {/* Subscription */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Subscription</CardTitle>
                <CardDescription>Manage your plan and billing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-semibold">{isSubscribed ? `${currentPlan || 'Pro'} Plan` : 'Free Plan'}</p>
                <p className="text-sm text-muted-foreground">
                  {isSubscribed && subscriptionEnd
                    ? `Renews on ${new Date(subscriptionEnd).toLocaleDateString()}`
                    : 'Limited features available'}
                </p>
              </div>
              <Button variant={isSubscribed ? "outline" : "default"} onClick={onManageSubscription}>
                {isSubscribed ? 'Manage' : 'Upgrade'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoice History */}
        <InvoiceHistory />
      </TabsContent>

      {/* Notifications Tab */}
      <TabsContent value="notifications" className="space-y-6 max-w-3xl">
        <NotificationSettings />
      </TabsContent>
    </Tabs>
  );
}
