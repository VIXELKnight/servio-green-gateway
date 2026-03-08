import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, MessageSquare } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[ResetPassword] Auth event:", event);
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
      // If we got a session via recovery token processing, allow password reset
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
        // Check URL params for recovery indicators
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
        if (params.get("type") === "recovery" || hashParams.get("type") === "recovery") {
          setIsRecovery(true);
        }
      }
    });

    // Check hash/query for recovery token before Supabase clears it
    const hash = window.location.hash;
    const search = window.location.search;
    if ((hash && hash.includes("type=recovery")) || (search && search.includes("type=recovery"))) {
      setIsRecovery(true);
    }

    // Also check if there's already a session (event may have fired before mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // If we're on /reset-password with a valid session, assume recovery
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Invalid or expired link</h1>
          <p className="text-muted-foreground">This password reset link is no longer valid.</p>
          <Link to="/auth">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center gap-2 text-primary mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold">Servio</span>
        </Link>

        {success ? (
          <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Password updated!</h3>
            <p className="text-muted-foreground text-sm">Redirecting you to login...</p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Set new password</h1>
              <p className="text-muted-foreground mt-2">Enter your new password below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
              </div>

              <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
