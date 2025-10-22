"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Share2, MessageCircle } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { SITE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PostCTAProps {
  title: string;
  slug: string;
}

export function PostCTA({ title, slug }: PostCTAProps) {
  const [visible, setVisible] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    // Find the main scrollable element
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const handleScroll = () => {
      if (dismissed) return;

      // Calculate scroll percentage on main element
      const scrollTop = mainElement.scrollTop;
      const scrollHeight = mainElement.scrollHeight - mainElement.clientHeight;

      // Prevent NaN when there's no scrollable content
      if (scrollHeight <= 0) {
        setVisible(false);
        return;
      }

      const scrollPercentage = (scrollTop / scrollHeight) * 100;
      setVisible(scrollPercentage > 50);
    };

    mainElement.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position

    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, [dismissed]);

  const handleShare = async () => {
    const url = `${SITE_CONFIG.url}/${slug}/`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  if (!visible || dismissed) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-3rem)]",
        "transition-all duration-500 ease-out",
        "animate-slide-up"
      )}
      style={{
        animation: "slideUp 0.5s ease-out"
      }}
    >
      <Card className="shadow-lg border-2">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <CardHeader className="pb-3">
          <CardTitle className="text-lg pr-6">Enjoyed this post?</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Share it with others or join our community for more DFIR content!
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full justify-start"
              size="sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share this post
            </Button>

            <a
              href={SITE_CONFIG.links.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                variant="default"
                className="w-full justify-start bg-[#5865F2] hover:bg-[#4752C4]"
                size="sm"
              >
                <SiDiscord className="h-4 w-4 mr-2" />
                Join our Discord
              </Button>
            </a>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            New posts every week
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
