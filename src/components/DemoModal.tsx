import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import demoThumbnail from "@/assets/demo-thumbnail.jpg";

interface DemoModalProps {
  trigger?: React.ReactNode;
}

const DemoModal = ({ trigger }: DemoModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setIsPlaying(false);
    }}>
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
          {/* Video player */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {isPlaying ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
                title="Servio Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <img 
                  src={demoThumbnail} 
                  alt="Servio AI Demo" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button 
                    onClick={handlePlay}
                    className="w-20 h-20 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-primary/30"
                  >
                    <Play className="w-10 h-10 text-primary-foreground ml-1" fill="currentColor" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-medium opacity-80">2:34</p>
                </div>
              </>
            )}
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-semibold text-foreground mb-1">AI Inbox</h4>
              <p className="text-sm text-muted-foreground">Smart email categorization & auto-responses</p>
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
