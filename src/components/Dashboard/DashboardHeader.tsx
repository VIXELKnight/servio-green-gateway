import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "./NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  showSearch?: boolean;
  onNavigate?: (tab: string) => void;
}

export function DashboardHeader({ 
  title, 
  description, 
  isLoading, 
  onRefresh,
  showSearch = false,
  onNavigate
}: DashboardHeaderProps) {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications 
  } = useNotifications();

  const handleNotificationClick = (notification: { conversationId?: string }) => {
    if (notification.conversationId && onNavigate) {
      onNavigate("bots");
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 w-64 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        )}
        
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClear={clearNotifications}
          onNotificationClick={handleNotificationClick}
        />
        
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh} 
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}
      </div>
    </div>
  );
}
