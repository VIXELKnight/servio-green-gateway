import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";

interface DemoModalProps {
  trigger?: React.ReactNode;
}

const DemoModal = ({ trigger }: DemoModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="heroOutline" size="xl">
            <Play className="w-5 h-5" />
            Watch Demo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-foreground">
            See Servio in Action
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          {/* Video placeholder - replace with actual video embed */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Play className="w-10 h-10 text-primary" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">
                Demo Video Coming Soon
              </p>
              <p className="text-muted-foreground/70 text-sm max-w-md text-center">
                Our product demo showcasing AI-powered customer support automation, 
                intelligent inbox management, and seamless integrations.
              </p>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <div className="absolute top-4 left-10 w-3 h-3 rounded-full bg-yellow-500" />
            <div className="absolute top-4 left-16 w-3 h-3 rounded-full bg-primary" />
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-semibold text-foreground mb-1">AI Inbox</h4>
              <p className="text-sm text-muted-foreground">Smart email categorization & responses</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-semibold text-foreground mb-1">24/7 Support</h4>
              <p className="text-sm text-muted-foreground">Always-on customer assistance</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-semibold text-foreground mb-1">Analytics</h4>
              <p className="text-sm text-muted-foreground">Deep insights into customer needs</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoModal;
