import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Sparkles, CheckCircle, ArrowRight, MessageSquare } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        setResetSent(true);
        toast({ 
          title: "Check your email", 
          description: "We've sent you a password reset link." 
        });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've successfully logged in." });
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast({ title: "Account created!", description: "You're now signed in." });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "AI-powered customer support",
    "Multi-channel integration",
    "Real-time analytics",
    "24/7 automated responses",
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-300/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-green-200/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary-foreground mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">Servio</span>
          </Link>

          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-sm text-primary-foreground/90">
              <Sparkles className="w-4 h-4 text-green-200" />
              AI-Powered Platform
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight mb-6">
            Transform Your
            <br />
            <span className="text-green-200">Customer Service</span>
          </h1>

          <p className="text-lg text-primary-foreground/80 mb-10 max-w-md">
            Join thousands of businesses using Servio to deliver exceptional 
            customer experiences with AI automation.
          </p>

          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-primary-foreground/90">
                <div className="w-6 h-6 rounded-full bg-green-200/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-200" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          {/* Testimonial */}
          <div className="mt-12 p-6 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10">
            <p className="text-primary-foreground/80 italic mb-4">
              "Servio reduced our response time by 80% and our customers love the instant support."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-200/30 flex items-center justify-center text-primary-foreground font-semibold">
                JD
              </div>
              <div>
                <p className="text-primary-foreground font-medium">John Davis</p>
                <p className="text-primary-foreground/60 text-sm">CEO, TechStart Inc.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 text-primary mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">Servio</span>
          </Link>

          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Auth Card */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {mode === "login" && "Welcome back"}
                {mode === "signup" && "Create your account"}
                {mode === "forgot" && "Reset password"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {mode === "login" && "Sign in to access your dashboard"}
                {mode === "signup" && "Get started with Servio today"}
                {mode === "forgot" && "Enter your email to receive a reset link"}
              </p>
            </div>

            {/* Reset sent message */}
            {mode === "forgot" && resetSent ? (
              <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Check your inbox</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMode("login");
                    setResetSent(false);
                  }}
                >
                  Back to login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name - Signup only */}
                {mode === "signup" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                        required={mode === "signup"}
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-muted/50 border-border focus:bg-background transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Password - Login/Signup only */}
                {mode !== "forgot" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Password</label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
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
                    {mode === "signup" && (
                      <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 text-base font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Please wait...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {mode === "login" && "Sign In"}
                      {mode === "signup" && "Create Account"}
                      {mode === "forgot" && "Send Reset Link"}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* Divider */}
            {mode !== "forgot" && !resetSent && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                {/* Toggle Mode */}
                <div className="text-center">
                  <p className="text-muted-foreground">
                    {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                    <button
                      type="button"
                      onClick={() => setMode(mode === "login" ? "signup" : "login")}
                      className="ml-2 text-primary font-medium hover:text-primary/80 transition-colors"
                    >
                      {mode === "login" ? "Sign up" : "Sign in"}
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* Back to login from forgot */}
            {mode === "forgot" && !resetSent && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </button>
              </div>
            )}

            {/* Terms */}
            {mode === "signup" && (
              <p className="text-xs text-center text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link to="/terms-of-service" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
