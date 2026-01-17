import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  MessageCircle, 
  Video, 
  FileText,
  ExternalLink,
  Mail
} from "lucide-react";

const helpResources = [
  {
    title: "Getting Started Guide",
    description: "Learn the basics of setting up your AI bots",
    icon: BookOpen,
    action: "Read Guide"
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step walkthroughs",
    icon: Video,
    action: "Watch Now"
  },
  {
    title: "API Documentation",
    description: "Technical docs for developers",
    icon: FileText,
    action: "View Docs"
  },
  {
    title: "Contact Support",
    description: "Get help from our team",
    icon: Mail,
    action: "Email Us"
  },
];

const faqs = [
  {
    question: "How do I connect my Instagram account?",
    answer: "Go to your bot's Channels tab and click 'Connect Instagram'. You'll be redirected to authorize the connection."
  },
  {
    question: "What happens when the AI can't answer a question?",
    answer: "If enabled, the auto-triage feature will escalate complex queries to your team for human follow-up."
  },
  {
    question: "Can I customize the chat widget appearance?",
    answer: "Yes! In the Channels section, click on 'Customize Widget' to change colors, position, and branding."
  },
  {
    question: "How do I add knowledge to my bot?",
    answer: "Navigate to your bot's Knowledge Base tab and add articles, FAQs, or import documents."
  },
];

export function HelpView() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Resources Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {helpResources.map((resource) => (
          <Card key={resource.title} className="group hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <resource.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                  <Button variant="link" className="p-0 h-auto text-primary">
                    {resource.action}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">{faq.question}</h4>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Live Chat */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Need more help?</h3>
              <p className="text-sm text-muted-foreground">Our support team is available 24/7</p>
            </div>
            <Button>Start Chat</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
