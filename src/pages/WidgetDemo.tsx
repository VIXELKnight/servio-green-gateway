import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Code, Smartphone, Globe, Zap, CheckCircle } from "lucide-react";

const WidgetDemo = () => {
  // Use a real active bot channel embed key for demo
  const [demoKey] = useState("cd7fa1ba-6843-480c-a864-6a6c9589d395");
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    // Inject the widget script for demo
    const existingScript = document.querySelector('script[data-embed-key]');
    if (existingScript) {
      existingScript.remove();
    }

    // Remove existing widget container
    const existingWidget = document.getElementById('servio-widget-container');
    if (existingWidget) {
      existingWidget.remove();
    }

    // Create and inject demo widget
    const script = document.createElement('script');
    script.src = '/widget.js';
    script.setAttribute('data-embed-key', demoKey);
    script.onload = () => setWidgetLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      const widget = document.getElementById('servio-widget-container');
      if (widget) {
        widget.remove();
      }
      script.remove();
    };
  }, [demoKey]);

  const features = [
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Instant messaging with typing indicators and smooth animations"
    },
    {
      icon: Zap,
      title: "AI-Powered Responses",
      description: "Intelligent automation that learns from your knowledge base"
    },
    {
      icon: Globe,
      title: "Multi-Channel",
      description: "Same bot works on website, WhatsApp, and Instagram"
    },
    {
      icon: Smartphone,
      title: "Mobile Responsive",
      description: "Looks great on any device, automatically adapts to screen size"
    }
  ];

  const installSteps = [
    {
      step: 1,
      title: "Create Your Bot",
      description: "Sign up and create a new bot in your dashboard with custom instructions"
    },
    {
      step: 2,
      title: "Add Knowledge Base",
      description: "Upload FAQs and documentation to train your bot on your business"
    },
    {
      step: 3,
      title: "Copy Embed Code",
      description: "Get your unique embed code from the Channels tab"
    },
    {
      step: 4,
      title: "Paste & Go Live",
      description: "Add the script to your website and start helping customers instantly"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container px-4 md:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link to="/auth">
            <Button>Get Started Free</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-sm font-medium text-primary-foreground/90 mb-6">
              <MessageSquare className="w-4 h-4" />
              Interactive Demo
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground mb-6">
              Experience the
              <br />
              <span className="text-green-200">Chat Widget</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Click the chat button in the bottom-right corner to see our AI-powered widget in action.
              This is exactly what your customers will experience.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-foreground/60 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>{widgetLoaded ? "Widget is live – try it now!" : "Loading widget..."}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Widget Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for exceptional customer engagement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Easy Installation
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get your AI chatbot running in under 5 minutes
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {installSteps.map((item) => (
                <Card key={item.step} className="relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                  <CardHeader className="pr-16">
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Code Example */}
          <div className="max-w-3xl mx-auto mt-12">
            <Card className="border-primary/20 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  Just One Line of Code
                </CardTitle>
                <CardDescription>
                  Add this script tag to your website before the closing &lt;/body&gt; tag
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code className="text-foreground">
                    {`<script src="https://YOUR_DOMAIN.com/widget.js" data-embed-key="YOUR_EMBED_KEY"></script>`}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Replace YOUR_DOMAIN with your published app domain and YOUR_EMBED_KEY with your bot's embed key from the dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 gradient-hero">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Ready to Transform Your Customer Support?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Join thousands of businesses using Servio to automate support and delight customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button variant="hero" size="xl">
                  Start Free Trial
                </Button>
              </Link>
              <a href="/#pricing">
                <Button variant="heroOutline" size="xl">
                  View Pricing
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card">
        <div className="container px-4 md:px-6 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Servio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WidgetDemo;
