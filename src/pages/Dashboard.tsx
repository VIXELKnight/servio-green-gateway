import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  LogOut, 
  Mail, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  CreditCard,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

const Dashboard = () => {
  const { user, isLoading, signOut, isSubscribed, currentPlan, subscriptionEnd } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      window.open(data.url, "_blank");
    } catch (error) {
      console.error("Error opening customer portal:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const stats = [
    { label: "Emails Processed", value: "1,247", change: "+12%", icon: Mail },
    { label: "Response Time", value: "2.3m", change: "-18%", icon: Clock },
    { label: "Satisfaction Rate", value: "94%", change: "+3%", icon: TrendingUp },
    { label: "Active Tickets", value: "23", change: "-5", icon: MessageSquare },
  ];

  const quickActions = [
    { label: "View Inbox", icon: Mail, href: "#" },
    { label: "Analytics", icon: BarChart3, href: "#" },
    { label: "Team", icon: Users, href: "#" },
    { label: "Settings", icon: Settings, href: "#" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              Servio
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 md:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your customer support today.
          </p>
        </div>

        {/* Subscription Status */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  {isSubscribed ? (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {isSubscribed ? `${currentPlan || 'Active'} Plan` : 'Free Plan'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isSubscribed && subscriptionEnd
                      ? `Renews on ${new Date(subscriptionEnd).toLocaleDateString()}`
                      : 'Upgrade to unlock all features'}
                  </p>
                </div>
              </div>
              <Button 
                variant={isSubscribed ? "outline" : "default"}
                onClick={isSubscribed ? handleManageSubscription : () => navigate("/#pricing")}
              >
                {isSubscribed ? 'Manage Subscription' : 'Upgrade Plan'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump to common tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  asChild
                >
                  <a href={action.href}>
                    <action.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm">{action.label}</span>
                  </a>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest customer interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: "New support ticket", desc: "Order #12345 - Shipping inquiry", time: "5 min ago", icon: MessageSquare },
                  { title: "Email replied", desc: "Re: Product question answered by AI", time: "12 min ago", icon: Mail },
                  { title: "Ticket resolved", desc: "Refund request processed", time: "1 hour ago", icon: CheckCircle2 },
                  { title: "Customer feedback", desc: "5-star rating received", time: "2 hours ago", icon: TrendingUp },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.desc}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
