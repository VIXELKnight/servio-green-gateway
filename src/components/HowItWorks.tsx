import { MessageSquare, Zap, BarChart3, CheckCircle, ArrowRight, Bot, Users, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Bot,
    step: "01",
    title: "Create Your AI Bot",
    description: "Set up your bot in minutes with custom instructions and personality. No coding required.",
    highlight: "5 min setup"
  },
  {
    icon: MessageSquare,
    step: "02",
    title: "Connect Your Channels",
    description: "Integrate your website, WhatsApp, and Instagram with one-click connections.",
    highlight: "3 channels"
  },
  {
    icon: Zap,
    step: "03",
    title: "AI Handles Queries",
    description: "Your bot automatically responds to customer inquiries using your knowledge base.",
    highlight: "24/7 active"
  },
  {
    icon: Users,
    step: "04",
    title: "Smart Escalation",
    description: "Complex issues are seamlessly transferred to your team with full context.",
    highlight: "Zero lost context"
  },
];

const metrics = [
  { value: "80%", label: "Queries Automated" },
  { value: "3x", label: "Faster Resolution" },
  { value: "50%", label: "Cost Reduction" },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4" />
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Get Started in <span className="text-gradient">Minutes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your customer service with our simple 4-step setup process.
            No technical expertise required.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line for desktop */}
          <div className="hidden lg:block absolute top-24 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative group"
              >
                <div className="relative bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full">
                  {/* Step number badge */}
                  <div className="absolute -top-4 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
                    Step {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mt-4 mb-4 group-hover:bg-primary/20 transition-colors">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {step.description}
                  </p>
                  
                  {/* Highlight badge */}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    {step.highlight}
                  </span>
                </div>
                
                {/* Arrow for mobile/tablet */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <ArrowRight className="w-6 h-6 text-primary/40 rotate-90 md:rotate-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-20 p-8 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">The Results Speak for Themselves</h3>
            <p className="text-muted-foreground">Average improvements our customers see within 30 days</p>
          </div>
          <div className="grid grid-cols-3 gap-8">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary mb-2">{metric.value}</div>
                <div className="text-sm md:text-base text-muted-foreground">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
