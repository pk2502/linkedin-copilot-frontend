"use client";

import { Button } from "@/components/ui/button";

export type Tone = "formal" | "friendly" | "concise";

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: "formal", label: "Formal", description: "Professional & structured" },
  { value: "friendly", label: "Friendly", description: "Warm & conversational" },
  { value: "concise", label: "Concise", description: "Short & direct" },
];

interface ToneSelectorProps {
  value: Tone;
  onChange: (tone: Tone) => void;
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">Tone</label>
      <div className="flex gap-2">
        {TONES.map((tone) => (
          <button
            key={tone.value}
            type="button"
            onClick={() => onChange(tone.value)}
            className={`flex-1 rounded-md border px-3 py-2 text-left transition-colors ${
              value === tone.value
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/50"
            }`}
          >
            <div className="text-xs font-medium">{tone.label}</div>
            <div className={`text-xs ${value === tone.value ? "text-background/70" : "text-muted-foreground"}`}>
              {tone.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
