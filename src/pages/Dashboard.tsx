import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  ArrowRight,
  Plus,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const { user, isLoading: authLoading, signOut, isSubscribed, currentPlan, subscriptionEnd } = useAuth();
  const { stats, activities, tickets, isLoading: dataLoading, createTicket, refreshData } = useDashboardData();
  const navigate = useNavigate();
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      window.open(data.url, "_blank");
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Failed to open subscription portal");
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketTitle.trim()) {
      toast.error("Please enter a ticket title");
      return;
    }

    setIsSubmitting(true);
    const result = await createTicket(ticketTitle, ticketDescription);
    setIsSubmitting(false);

    if (result) {
      toast.success("Ticket created successfully!");
      setNewTicketOpen(false);
      setTicketTitle("");
      setTicketDescription("");
    } else {
      toast.error("Failed to create ticket");
    }
  };

  const isLoading = authLoading || dataLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "ticket_created": return MessageSquare;
      case "email_sent": return Mail;
      case "ticket_resolved": return CheckCircle2;
      case "feedback": return TrendingUp;
      default: return MessageSquare;
    }
  };

  const displayStats = [
    { label: "Emails Processed", value: stats.emailsProcessed.toLocaleString(), change: "+12%", icon: Mail },
    { label: "Avg Response Time", value: `${stats.avgResponseTime.toFixed(1)}m`, change: "-18%", icon: Clock },
    { label: "Satisfaction Rate", value: `${stats.satisfactionRate.toFixed(0)}%`, change: "+3%", icon: TrendingUp },
    { label: "Active Tickets", value: stats.activeTickets.toString(), change: String(stats.activeTickets), icon: MessageSquare },
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
              <Button variant="ghost" size="sm" onClick={refreshData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your customer support today.
            </p>
          </div>
          <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Support Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <Input 
                    placeholder="Brief description of the issue"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea 
                    placeholder="Provide more details..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreateTicket} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
          {displayStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`text-sm font-medium ${
                    stat.change.startsWith('+') || stat.change.startsWith('-') ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {stat.change.startsWith('+') || stat.change.startsWith('-') ? stat.change : ''}
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
              <CardDescription>
                {activities.length > 0 
                  ? "Latest customer interactions" 
                  : "Create your first ticket to see activity here"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((item) => {
                    const Icon = getActivityIcon(item.activityType);
                    return (
                      <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Create a ticket to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Support Tickets */}
        {tickets.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Support Tickets</CardTitle>
              <CardDescription>Track and manage your support requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className={`w-3 h-3 rounded-full ${
                      ticket.status === 'open' ? 'bg-yellow-500' :
                      ticket.status === 'in_progress' ? 'bg-blue-500' :
                      ticket.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{ticket.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{ticket.description || 'No description'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ticket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      ticket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{ticket.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
