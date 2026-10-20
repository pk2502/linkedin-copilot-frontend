"use client";

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { TWEAKS, draftErrorMessage, draftService, type DraftResult, type TweakInstruction } from "@/lib/drafts";

const ANGLES = ["Common ground", "Their work", "Straight to the point"];

interface VariantState {
  text: string;
  /** Generation to tweak next: the draft itself, or the latest tweak of this card. */
  sourceId: number;
  variant: number;
}

function VariantCard({ index, initial }: { index: number; initial: VariantState }) {
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState<TweakInstruction | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(state.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tweak = async (instruction: TweakInstruction) => {
    setBusy(instruction);
    setError("");
    try {
      const result = await draftService.tweak(state.sourceId, state.variant, instruction);
      // A tweak is saved as its own one-variant draft; further tweaks build on it.
      setState({ text: result.text, sourceId: result.id, variant: 0 });
    } catch (err) {
      setError(draftErrorMessage(err) ?? "");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Option {index + 1} <span className="text-muted-foreground font-normal">· {ANGLES[index]}</span>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={copy} aria-label={`Copy option ${index + 1}`}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea value={state.text} readOnly rows={5} className="resize-none" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {TWEAKS.map((t) => (
              <Button
                key={t.value}
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() => tweak(t.value)}
              >
                {busy === t.value && <Loader2 className="size-3 animate-spin" />}
                {t.label}
              </Button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{state.text.length} chars</span>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

export function DraftVariants({ result, loading }: { result: DraftResult | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Writing drafts">
        {ANGLES.map((angle) => (
          <Card key={angle}>
            <CardContent className="h-36 animate-pulse bg-muted rounded-md" />
          </Card>
        ))}
      </div>
    );
  }
  if (!result) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Pick one, tweak it, copy it. You send it yourself.</p>
      {result.variants.map((text, index) => (
        <VariantCard
          // A new result resets every card.
          key={`${result.id}-${index}`}
          index={index}
          initial={{ text, sourceId: result.id, variant: index }}
        />
      ))}
    </div>
  );
}
