import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  MessageCircle, 
  Video, 
  FileText,
  ExternalLink,
  Mail,
  Bot,
  Zap,
  Globe,
  Settings,
  ChevronDown,
  ChevronRight,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const helpResources = [
  {
    title: "Getting Started Guide",
    description: "Learn the basics of setting up your AI bots and connecting channels",
    icon: BookOpen,
    action: "Read Guide",
    content: `
## Quick Start with Servio

### Step 1: Create Your First Bot
1. Go to the **AI Bots** section in the sidebar
2. Click **Create Bot** and give it a name
3. Write custom instructions for how the bot should respond
4. Set a welcome message for new conversations

### Step 2: Add Knowledge Base
1. Navigate to your bot's **Knowledge Base** tab
2. Add FAQs, product info, or support articles
3. The AI will use this information to answer customer questions

### Step 3: Connect Channels
1. Go to the **Channels** tab
2. Enable **Website Widget** to get an embed code
3. Connect **Instagram** or **WhatsApp** via OAuth

### Step 4: Go Live
1. Toggle your bot to **Active**
2. Embed the widget on your website
3. Monitor conversations in the **Conversations** tab
    `
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step walkthroughs for common tasks",
    icon: Video,
    action: "Coming Soon",
    content: `
## Video Library (Coming Soon)

We're currently creating a comprehensive video library covering:

- **Bot Setup Basics** - Creating and configuring your first bot
- **Knowledge Base Training** - Teaching your bot about your business
- **Channel Integration** - Connecting Instagram, WhatsApp, and websites
- **Shopify Integration** - Setting up e-commerce support
- **Advanced Customization** - Custom instructions and escalation rules
- **Analytics & Reporting** - Understanding your support metrics

Check back soon for our full video tutorial series!
    `
  },
  {
    title: "API Documentation",
    description: "Technical docs for developers integrating Servio",
    icon: FileText,
    action: "View Docs",
    content: `
## API & Integration Docs

### Widget Embed Code
\`\`\`html
<script 
  src="https://your-domain.com/widget.js" 
  data-embed-key="YOUR_EMBED_KEY">
</script>
\`\`\`

### Webhook Events
Servio can send webhooks when:
- New conversation started
- Conversation escalated
- Customer rated conversation

### REST API (Coming Soon)
We're working on a full REST API for:
- Managing bots programmatically
- Bulk knowledge base updates
- Analytics export
- Custom integrations

Contact support for early access to beta API features.
    `
  },
  {
    title: "Contact Support",
    description: "Get help from our team via email",
    icon: Mail,
    action: "support@servio.app",
    content: `
## Contact Our Team

**Email Support**
support@servio.app

**Response Times**
- Starter Plan: Within 48 hours
- Professional Plan: Within 24 hours
- Enterprise Plan: Within 4 hours + dedicated support

**What to Include**
When contacting support, please include:
1. Your account email
2. Bot name (if applicable)
3. Clear description of the issue
4. Screenshots if relevant
5. Steps to reproduce the problem

**Create a Ticket**
You can also create support tickets directly from the **Tickets** section in your dashboard.
    `
  },
];

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I create my first AI bot?",
        answer: "Go to the AI Bots section in your dashboard sidebar, click 'Create Bot', give it a name and description, then customize the instructions and welcome message. Your bot is ready to deploy once you've added some knowledge base entries."
      },
      {
        question: "How do I connect my Instagram account?",
        answer: "Navigate to your bot's Channels tab and click 'Connect Instagram'. You'll be redirected to authorize the connection via Facebook. Make sure your Instagram account is a Business or Creator account connected to a Facebook Page."
      },
      {
        question: "Can I use the same bot on multiple channels?",
        answer: "Yes! Each bot can be connected to multiple channels simultaneously - Website widget, Instagram DMs, and WhatsApp. The AI maintains consistent responses across all channels."
      },
    ]
  },
  {
    category: "AI & Responses",
    questions: [
      {
        question: "What happens when the AI can't answer a question?",
        answer: "If enabled, the auto-triage feature will escalate complex queries to your team for human follow-up. You'll see these in the Tickets section. You can configure the escalation sensitivity in your bot settings."
      },
      {
        question: "How do I train my bot on my business?",
        answer: "Add entries to your Knowledge Base! Include FAQs, product information, pricing details, policies, and anything else your customers commonly ask about. The AI uses this information to provide accurate, relevant responses."
      },
      {
        question: "Can I see what my bot is saying to customers?",
        answer: "Yes, all conversations are logged in the Conversations tab. You can view the full message history, see AI-generated responses, and monitor customer satisfaction."
      },
    ]
  },
  {
    category: "Widget & Customization",
    questions: [
      {
        question: "Can I customize the chat widget appearance?",
        answer: "Yes! In the Channels section, you can customize the widget's primary color, position (left or right), welcome message, and bot avatar. The widget automatically adapts to light and dark modes."
      },
      {
        question: "How do I embed the widget on my website?",
        answer: "Copy the embed code from your bot's Channels tab and paste it before the closing </body> tag on your website. It's a single script tag that works on any website."
      },
      {
        question: "Is the widget mobile-friendly?",
        answer: "Absolutely! The widget is fully responsive and provides an excellent experience on mobile devices, tablets, and desktops."
      },
    ]
  },
  {
    category: "Billing & Plans",
    questions: [
      {
        question: "How do I upgrade my plan?",
        answer: "Click 'Manage Subscription' in the sidebar or go to Settings > Billing. You can view plan features and upgrade directly in the app."
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes, you can cancel at any time from the subscription management modal. Your access continues until the end of your current billing period."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment partner, Stripe."
      },
    ]
  },
];

export function HelpView() {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedResourceData = helpResources.find(r => r.title === selectedResource);

  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          q => 
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0)
    : faqs;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search help articles and FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {helpResources.map((resource) => (
          <Card 
            key={resource.title} 
            className="group hover:shadow-md transition-all cursor-pointer"
            onClick={() => setSelectedResource(resource.title)}
          >
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
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Resource Content */}
      {selectedResourceData && (
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <selectedResourceData.icon className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{selectedResourceData.title}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedResource(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {selectedResourceData.content.trim()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions about Servio</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFaqs.length > 0 ? (
            <div className="space-y-6">
              {filteredFaqs.map((category) => (
                <div key={category.category}>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                    {category.category}
                  </h4>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`${category.category}-${index}`}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="hover:no-underline text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No results found for "{searchQuery}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Live Chat CTA */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Still need help?</h3>
              <p className="text-sm text-muted-foreground">
                Create a support ticket and our team will get back to you within 24 hours.
              </p>
            </div>
            <Button onClick={() => {
              const ticketsTab = document.querySelector('[data-tab="tickets"]') as HTMLElement;
              if (ticketsTab) ticketsTab.click();
            }}>
              Create Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
