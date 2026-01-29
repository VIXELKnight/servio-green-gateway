import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

// Dashboard components
import { DashboardSidebar } from "@/components/Dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader";
import { DashboardOverview } from "@/components/Dashboard/DashboardOverview";
import { TicketManagement } from "@/components/Dashboard/TicketManagement";
import { Analytics } from "@/components/Dashboard/Analytics";
import { BotManagement } from "@/components/Dashboard/BotManagement";
import { SettingsView } from "@/components/Dashboard/SettingsView";
import { HelpView } from "@/components/Dashboard/HelpView";
import { OnboardingWizard } from "@/components/Dashboard/OnboardingWizard";
import { SubscriptionManagementModal } from "@/components/Dashboard/SubscriptionManagementModal";

const Dashboard = () => {
  const { user, isLoading: authLoading, signOut, isSubscribed, currentPlan, currentProductId, subscriptionEnd, checkSubscription } = useAuth();
  const { stats, activities, tickets, isLoading: dataLoading, createTicket, updateTicket, deleteTicket, refreshData } = useDashboardData();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("overview");
  const [botsCount, setBotsCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch bots count and check onboarding status
  useEffect(() => {
    async function fetchBotsAndCheckOnboarding() {
      if (!user) return;
      
      const { data, count } = await supabase
        .from("bots")
        .select("*", { count: "exact" })
        .eq("user_id", user.id);
      
      const botCount = count || 0;
      setBotsCount(data?.filter(b => b.is_active).length || 0);
      
      // Show onboarding if user has no bots and is subscribed
      if (botCount === 0 && isSubscribed && !onboardingChecked) {
        setShowOnboarding(true);
      }
      setOnboardingChecked(true);
    }
    
    if (!authLoading) {
      fetchBotsAndCheckOnboarding();
    }
  }, [user, isSubscribed, authLoading, onboardingChecked]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    setCurrentTab("bots");
    // Refresh bots count
    const { count } = await supabase
      .from("bots")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id)
      .eq("is_active", true);
    setBotsCount(count || 0);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  const handleManageSubscription = () => {
    setShowSubscriptionModal(true);
  };

  const isLoading = authLoading || dataLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getHeaderConfig = () => {
    switch (currentTab) {
      case "overview":
        return { 
          title: `Welcome back, ${user.email?.split("@")[0]}!`, 
          description: "Here's what's happening with your customer support today." 
        };
      case "bots":
        return { 
          title: "AI Bots", 
          description: "Create and manage AI-powered customer service bots" 
        };
      case "analytics":
        return { 
          title: "Analytics", 
          description: "Track your support performance and trends" 
        };
      case "tickets":
        return { 
          title: "Tickets", 
          description: "View and manage customer support tickets" 
        };
      case "settings":
        return { 
          title: "Settings", 
          description: "Manage your account and preferences" 
        };
      case "help":
        return { 
          title: "Help & Support", 
          description: "Get help and learn how to use Servio" 
        };
      default:
        return { title: "Dashboard", description: "" };
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case "overview":
        return (
          <DashboardOverview 
            stats={stats} 
            activities={activities}
            botsCount={botsCount}
            onNavigate={setCurrentTab}
          />
        );
      case "bots":
        return <BotManagement />;
      case "analytics":
        return (
          <Analytics 
            stats={{
              total_tickets: stats.activeTickets + (tickets?.filter(t => t.status === 'resolved').length || 0),
              resolved_tickets: tickets?.filter(t => t.status === 'resolved').length || 0,
              avg_response_time_minutes: stats.avgResponseTime,
              satisfaction_rate: stats.satisfactionRate,
              emails_processed: stats.emailsProcessed,
            }}
            tickets={tickets?.map(t => ({
              id: t.id,
              created_at: t.createdAt,
              status: t.status,
              resolved_at: t.resolvedAt,
            })) || []}
          />
        );
      case "tickets":
        return (
          <TicketManagement 
            tickets={tickets}
            onCreateTicket={createTicket}
            onUpdateTicket={updateTicket}
            onDeleteTicket={deleteTicket}
          />
        );
      case "settings":
        return (
          <SettingsView 
            userEmail={user.email}
            isSubscribed={isSubscribed}
            currentPlan={currentPlan}
            subscriptionEnd={subscriptionEnd}
            onManageSubscription={handleManageSubscription}
          />
        );
      case "help":
        return <HelpView />;
      default:
        return null;
    }
  };

  const headerConfig = getHeaderConfig();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/30">
          <DashboardSidebar
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            onSignOut={signOut}
            onManageSubscription={handleManageSubscription}
            userEmail={user.email}
            isSubscribed={isSubscribed}
            currentPlan={currentPlan}
          />
          
          <main className="flex-1 overflow-auto">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
              <DashboardHeader
                title={headerConfig.title}
                description={headerConfig.description}
                isLoading={isLoading}
                onRefresh={refreshData}
                showSearch={currentTab === "tickets"}
                onNavigate={setCurrentTab}
              />
              
              {renderContent()}
            </div>
          </main>
        </div>

        {/* Onboarding Wizard */}
        {showOnboarding && user && (
          <OnboardingWizard
            userId={user.id}
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}

        {/* Subscription Management Modal (used by sidebar + settings) */}
        <SubscriptionManagementModal
          open={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          currentProductId={currentProductId}
          isSubscribed={isSubscribed}
          onSubscriptionChange={checkSubscription}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default Dashboard;
