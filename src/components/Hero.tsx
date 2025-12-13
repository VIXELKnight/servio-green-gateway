import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import DemoModal from "./DemoModal";
import { useAuth } from "@/hooks/useAuth";

const Hero = () => {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center gradient-hero overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-300/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-green-200/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
            <Sparkles className="w-4 h-4 text-green-200" />
            <span className="text-sm font-medium text-primary-foreground/90">AI-Powered Customer Service</span>
          </div>

          {/* Title */}
          <h1 className="animate-fade-up-delay-1 text-4xl md:text-5xl lg:text-7xl font-extrabold text-primary-foreground leading-tight tracking-tight">
            Automate Your
            <br />
            <span className="text-green-200">Customer Support</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up-delay-2 text-lg md:text-xl text-primary-foreground/80 max-w-2xl leading-relaxed">
            Servio helps businesses deliver exceptional customer experiences with intelligent automation, 
            AI-powered inbox management, and seamless support solutions.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4 pt-4">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="hero" size="xl">
                {user ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <DemoModal />
          </div>

          {/* Trust badge */}
          <p className="animate-fade-up-delay-3 text-sm text-primary-foreground/60 pt-6">
            Trusted by 1,000+ businesses worldwide
          </p>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
