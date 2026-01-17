import { Button } from "@/components/ui/button";
import { RefreshCw, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  showSearch?: boolean;
}

export function DashboardHeader({ 
  title, 
  description, 
  isLoading, 
  onRefresh,
  showSearch = false 
}: DashboardHeaderProps) {
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
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </Button>
        
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
