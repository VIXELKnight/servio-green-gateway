import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Clock, 
  TrendingUp, 
  MessageSquare,
  Bot,
  Zap,
  ArrowUpRight,
  Plus,
  Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface DashboardOverviewProps {
  stats: {
    emailsProcessed: number;
    avgResponseTime: number;
    satisfactionRate: number;
    activeTickets: number;
  };
  activities: Array<{
    id: string;
    title: string;
    description: string;
    activityType: string;
    createdAt: string;
  }>;
  botsCount?: number;
  onNavigate: (tab: string) => void;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "ticket_created": return MessageSquare;
    case "email_sent": return Mail;
    case "ticket_resolved": return TrendingUp;
    default: return MessageSquare;
  }
};

export function DashboardOverview({ stats, activities, botsCount = 0, onNavigate }: DashboardOverviewProps) {
  const statCards = [
    { 
      label: "Messages Today", 
      value: stats.emailsProcessed.toLocaleString(), 
      change: "+12%",
      trend: "up",
      icon: Mail,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      label: "Avg Response", 
      value: `${stats.avgResponseTime.toFixed(0)}s`, 
      change: "-18%",
      trend: "down",
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    { 
      label: "Satisfaction", 
      value: `${stats.satisfactionRate.toFixed(0)}%`, 
      change: "+3%",
      trend: "up",
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    { 
      label: "Active Tickets", 
      value: stats.activeTickets.toString(), 
      change: null,
      trend: "neutral",
      icon: MessageSquare,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.label} 
            className={cn(
              "group hover:shadow-md transition-all duration-300 border-border/50",
              "animate-fade-up"
            )}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={cn("p-2.5 rounded-xl", stat.bgColor)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                {stat.change && (
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    stat.trend === "up" ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                  )}>
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Bots Card */}
        <Card className="lg:col-span-1 group hover:shadow-md transition-all border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI Bots</h3>
                <p className="text-sm text-muted-foreground">{botsCount} active</p>
              </div>
            </div>
            
            {botsCount === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first AI bot to automate support
                </p>
                <Button size="sm" onClick={() => onNavigate("bots")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bot
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full justify-between group-hover:border-primary/50"
                onClick={() => onNavigate("bots")}
              >
                Manage Bots
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest customer interactions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("tickets")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-1">
                {activities.slice(0, 5).map((item, index) => {
                  const Icon = getActivityIcon(item.activityType);
                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">No activity yet</p>
                <p className="text-sm text-muted-foreground">
                  Activity will appear here once you start using Servio
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
