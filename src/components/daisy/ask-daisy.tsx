"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "Explain what’s required",
  "Find someone qualified",
  "Lower the budget",
  "Rewrite this more clearly",
  "Summarize submissions",
  "Draft a reply",
] as const;

/** Ambient AI entry — no separate AI page. */
export function AskDaisy() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const ask = (text: string) => {
    toast.message("Daisy", {
      description:
        text.trim().length > 0
          ? `Got it — “${text.trim().slice(0, 80)}${text.trim().length > 80 ? "…" : ""}”. Live coaching is mocked in this build.`
          : "Ask from inside the workflow you’re on.",
    });
    setOpen(false);
    setPrompt("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="surface-interactive surface-press fixed right-4 bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] z-[var(--app-z-sticky)] min-h-11 gap-2 rounded-full shadow-sm animate-in fade-in-0 zoom-in-95 duration-200 md:right-6 md:bottom-6"
        >
          <Sparkles className="size-4" aria-hidden />
          Ask Daisy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ask Daisy</DialogTitle>
          <DialogDescription>
            Help with the work you’re looking at — not a separate AI workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => ask(s)}
            >
              {s}
            </Button>
          ))}
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What should Daisy do?"
          rows={3}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button
            type="button"
            disabled={prompt.trim().length === 0}
            onClick={() => ask(prompt)}
          >
            Ask
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
