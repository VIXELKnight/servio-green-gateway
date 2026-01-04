import { Headphones, Bot, Inbox, Globe, Smartphone, MessageSquare, Zap, Shield, BarChart3 } from "lucide-react";

const services = [
  {
    icon: Bot,
    title: "AI Chatbots",
    description: "Deploy intelligent chatbots that understand context and provide accurate responses 24/7.",
    features: ["Natural language processing", "Multi-language support", "Custom training"],
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Inbox,
    title: "Smart Inbox",
    description: "AI-powered inbox that categorizes, prioritizes, and drafts responses automatically.",
    features: ["Auto-categorization", "Priority detection", "Smart drafts"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Globe,
    title: "Website Widget",
    description: "Beautiful, customizable chat widget that integrates seamlessly with any website.",
    features: ["Easy installation", "Fully customizable", "Mobile responsive"],
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Smartphone,
    title: "WhatsApp Integration",
    description: "Connect your WhatsApp Business account for automated customer messaging.",
    features: ["Business API ready", "Template messages", "Media support"],
    color: "from-green-500 to-green-600",
  },
  {
    icon: MessageSquare,
    title: "Instagram DMs",
    description: "Automate your Instagram Direct Messages with AI-powered responses.",
    features: ["Auto-reply", "Story mentions", "Quick responses"],
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track performance, response times, and customer satisfaction in real-time.",
    features: ["Real-time metrics", "Custom reports", "Trend analysis"],
    color: "from-orange-500 to-amber-500",
  },
];

const benefits = [
  { icon: Zap, text: "10x Faster Response Times" },
  { icon: Shield, text: "Enterprise-Grade Security" },
  { icon: Headphones, text: "24/7 Automated Support" },
];

const Services = () => {
  return (
    <section id="services" className="py-24 md:py-32 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold uppercase tracking-wider mb-4">
            <Zap className="w-4 h-4" />
            Powerful Features
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Everything You Need to
            <span className="text-gradient"> Scale Support</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Comprehensive AI-powered solutions designed to transform how you handle customer interactions across all channels.
          </p>
        </div>

        {/* Benefits row */}
        <div className="flex flex-wrap justify-center gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <benefit.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium text-foreground">{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <service.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>

              {/* Features */}
              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
