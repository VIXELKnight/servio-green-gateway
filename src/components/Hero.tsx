import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play, CheckCircle, Globe, MessageSquare, Zap } from "lucide-react";
import DemoModal from "./DemoModal";
import { useAuth } from "@/hooks/useAuth";

const Hero = () => {
  const { user } = useAuth();

  const stats = [
    { value: "10K+", label: "Messages Handled" },
    { value: "98%", label: "Satisfaction Rate" },
    { value: "<2s", label: "Avg Response Time" },
  ];

  const features = [
    { icon: Globe, text: "Multi-channel support" },
    { icon: MessageSquare, text: "AI-powered responses" },
    { icon: Zap, text: "Instant setup" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center gradient-hero overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-300/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-green-200/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 left-1/6 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="container relative z-10 px-4 md:px-6 py-20">
        <div className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
            <Sparkles className="w-4 h-4 text-green-200" />
            <span className="text-sm font-medium text-primary-foreground/90">AI-Powered Customer Service Platform</span>
          </div>

          {/* Title */}
          <h1 className="animate-fade-up-delay-1 text-4xl md:text-6xl lg:text-7xl font-extrabold text-primary-foreground leading-tight tracking-tight">
            Transform Customer Support
            <br />
            <span className="text-green-200 relative">
              With AI Automation
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="rgba(187, 247, 208, 0.5)" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up-delay-2 text-lg md:text-xl text-primary-foreground/80 max-w-2xl leading-relaxed">
            Servio helps businesses deliver exceptional customer experiences with intelligent chatbots, 
            AI-powered inbox management, and seamless multi-channel support on Website, WhatsApp & Instagram.
          </p>

          {/* Feature pills */}
          <div className="animate-fade-up-delay-2 flex flex-wrap justify-center gap-3">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10"
              >
                <feature.icon className="w-4 h-4 text-green-200" />
                <span className="text-sm text-primary-foreground/80">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4 pt-4">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="hero" size="xl" className="group">
                {user ? "Go to Dashboard" : "Start Free Trial"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/widget-demo">
              <Button variant="heroOutline" size="xl" className="group">
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                See Live Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-up-delay-3 grid grid-cols-3 gap-8 pt-8 border-t border-primary-foreground/10 mt-8 w-full max-w-xl">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary-foreground">{stat.value}</div>
                <div className="text-xs md:text-sm text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="animate-fade-up-delay-3 flex flex-col items-center gap-4 pt-6">
            <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
              <CheckCircle className="w-4 h-4 text-green-200" />
              <span>No credit card required</span>
              <span className="mx-2">•</span>
              <CheckCircle className="w-4 h-4 text-green-200" />
              <span>Setup in 5 minutes</span>
              <span className="mx-2">•</span>
              <CheckCircle className="w-4 h-4 text-green-200" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
