"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { draftErrorMessage, draftService, type DraftResult, type DraftType } from "@/lib/drafts";
import type { Tone } from "@/lib/generation";

/** Submit state for the draft composer. */
export function useDraft(type: DraftType) {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async (fields: Record<string, string>, tone: Tone) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await draftService.create(type, fields, tone));
      // The first draft ticks off a step of the dashboard checklist.
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    } catch (err) {
      setError(draftErrorMessage(err) ?? "");
    } finally {
      setLoading(false);
    }
  };

  /** Clear the drafts and error, e.g. when the user switches message type. */
  const reset = () => {
    setResult(null);
    setError("");
  };

  return { result, loading, error, generate, reset };
}
