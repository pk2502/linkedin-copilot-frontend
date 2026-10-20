"use client";

import { useState } from "react";
import { draftErrorMessage, draftService, type DraftResult, type DraftType } from "@/lib/drafts";
import type { Tone } from "@/lib/generation";

/** Submit state shared by the four generator pages. */
export function useDraft(type: DraftType) {
  const [result, setResult] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async (fields: Record<string, string>, tone: Tone) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await draftService.create(type, fields, tone));
    } catch (err) {
      setError(draftErrorMessage(err) ?? "");
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, generate };
}
