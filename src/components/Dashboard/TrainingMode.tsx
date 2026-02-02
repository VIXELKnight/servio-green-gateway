import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, Star, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrainingModeProps {
  messageId: string;
  currentRating?: number;
  currentFeedback?: string;
  onRated?: () => void;
}

export function TrainingMode({ 
  messageId, 
  currentRating, 
  currentFeedback,
  onRated 
}: TrainingModeProps) {
  const [rating, setRating] = useState<number>(currentRating || 0);
  const [feedback, setFeedback] = useState(currentFeedback || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleQuickRate = async (value: number) => {
    setRating(value);
    await submitRating(value, feedback);
  };

  const submitRating = async (ratingValue: number, feedbackText: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("bot_messages")
        .update({ 
          rating: ratingValue,
          rating_feedback: feedbackText || null
        })
        .eq("id", messageId);

      if (error) throw error;

      toast.success("Rating saved! This helps improve AI responses.");
      onRated?.();
    } catch (error) {
      console.error("Error saving rating:", error);
      toast.error("Failed to save rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!rating) {
      toast.error("Please select a rating first");
      return;
    }
    await submitRating(rating, feedback);
    setShowFeedback(false);
  };

  if (currentRating) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>Rated:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "w-3 h-3",
              star <= currentRating ? "fill-amber-400 text-amber-400" : "text-muted"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Rate this response:</span>
        
        <div className="flex items-center gap-1">
          {/* Quick thumbs buttons */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleQuickRate(5)}
            disabled={isSubmitting}
          >
            <ThumbsUp className={cn(
              "w-3.5 h-3.5",
              rating === 5 ? "text-emerald-500 fill-emerald-500" : "text-muted-foreground"
            )} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleQuickRate(1)}
            disabled={isSubmitting}
          >
            <ThumbsDown className={cn(
              "w-3.5 h-3.5",
              rating === 1 ? "text-destructive fill-destructive" : "text-muted-foreground"
            )} />
          </Button>

          {/* Star rating */}
          <div className="flex items-center gap-0.5 ml-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => {
                  setRating(star);
                  setShowFeedback(true);
                }}
                disabled={isSubmitting}
                className="hover:scale-110 transition-transform"
              >
                <Star
                  className={cn(
                    "w-4 h-4 transition-colors",
                    star <= rating 
                      ? "fill-amber-400 text-amber-400" 
                      : "text-muted-foreground hover:text-amber-300"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback textarea */}
      {showFeedback && (
        <div className="flex gap-2">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What could be improved? (optional)"
            className="min-h-[60px] text-xs"
          />
          <Button
            size="sm"
            onClick={handleSubmitFeedback}
            disabled={isSubmitting}
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
