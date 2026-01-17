import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Bot, 
  BarChart3, 
  Ticket, 
  Settings,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
  onManageSubscription: () => void;
  userEmail?: string;
  isSubscribed?: boolean;
  currentPlan?: string | null;
}

const mainNavItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "bots", label: "AI Bots", icon: Bot },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "tickets", label: "Tickets", icon: Ticket },
];

const secondaryNavItems = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "help", label: "Help & Support", icon: HelpCircle },
];

export function DashboardSidebar({
  currentTab,
  onTabChange,
  onSignOut,
  onManageSubscription,
  userEmail,
  isSubscribed,
  currentPlan,
}: DashboardSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-xl text-foreground">Servio</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        onClick={() => onTabChange(item.id)}
                        isActive={currentTab === item.id}
                        className={cn(
                          "w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all",
                          currentTab === item.id
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-4 px-3">
          <div className="h-px bg-border" />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        onClick={() => onTabChange(item.id)}
                        isActive={currentTab === item.id}
                        className={cn(
                          "w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all",
                          currentTab === item.id
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        {/* Subscription Card */}
        {!isCollapsed && (
          <div className="mb-4 p-3 rounded-lg bg-accent/50 border border-accent">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-accent-foreground" />
              <span className="text-sm font-medium text-accent-foreground">
                {isSubscribed ? currentPlan || "Pro" : "Free Plan"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={onManageSubscription}
            >
              {isSubscribed ? "Manage" : "Upgrade"}
            </Button>
          </div>
        )}

        {/* User & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-muted-foreground">
              {userEmail?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail?.split("@")[0]}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
