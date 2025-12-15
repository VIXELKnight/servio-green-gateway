import { MessageSquare, Zap, BarChart3, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Connect Your Channels",
    description: "Integrate your website, WhatsApp, Instagram, and email in minutes. No coding required.",
  },
  {
    icon: Zap,
    step: "02",
    title: "AI Takes Over",
    description: "Our intelligent AI handles routine inquiries automatically, learning from every interaction.",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Human Handoff",
    description: "Complex issues are seamlessly escalated to your team with full context and history.",
  },
  {
    icon: BarChart3,
    step: "04",
    title: "Analyze & Improve",
    description: "Track performance, response times, and customer satisfaction to continuously improve.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes and transform your customer service experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-primary/20" />
              )}
              
              <div className="relative bg-background rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                {/* Step number */}
                <span className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {step.step}
                </span>
                
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
