import { Headphones, Bot, Inbox } from "lucide-react";

const services = [
  {
    icon: Headphones,
    title: "Customer Support",
    description: "24/7 professional support that keeps your customers happy. Our team handles inquiries with speed and care.",
    features: ["Multi-channel support", "Quick response times", "Trained specialists"],
  },
  {
    icon: Bot,
    title: "Smart Automation",
    description: "Intelligent chatbots, auto-replies, and FAQ management that handle routine queries instantly.",
    features: ["AI Chatbots", "Auto-reply systems", "FAQ automation"],
  },
  {
    icon: Inbox,
    title: "AI Inbox Management",
    description: "Let AI organize, prioritize, and respond to your inbox. Focus on what matters most.",
    features: ["Smart categorization", "Priority detection", "Draft responses"],
  },
];

const Services = () => {
  return (
    <section id="services" className="py-24 md:py-32 bg-background">
      <div className="container px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Services</span>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Everything You Need to
            <span className="text-gradient"> Scale Support</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comprehensive solutions designed to transform how you handle customer interactions.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <service.icon className="w-7 h-7 text-primary-foreground" />
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

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
