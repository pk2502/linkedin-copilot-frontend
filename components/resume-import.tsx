"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  RESUME_PDF_MAX_BYTES,
  parseErrorMessage,
  profileService,
  type ParsedProfile,
} from "@/lib/profile";

type Mode = "pdf" | "text";

/**
 * Lets the user fill the profile form from a resume. The suggestion is only
 * applied to the form; the user reviews it and saves as usual.
 */
export function ResumeImport({
  onParsed,
  hasExisting,
}: {
  onParsed: (parsed: ParsedProfile, replace: boolean) => void;
  hasExisting: boolean;
}) {
  const [mode, setMode] = useState<Mode>("pdf");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [replace, setReplace] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const parse = useMutation({
    mutationFn: profileService.parse,
    onSuccess: (parsed) => onParsed(parsed, replace),
  });

  const ready = mode === "pdf" ? file !== null : text.trim().length >= 40;
  const error = localError ?? (parse.isError ? parseErrorMessage(parse.error) : null);

  function pickFile(next: File | null) {
    setLocalError(null);
    parse.reset();
    if (next && next.size > RESUME_PDF_MAX_BYTES) {
      setFile(null);
      setLocalError("PDF must be 2 MB or smaller.");
      return;
    }
    setFile(next);
  }

  return (
    <div className="rounded-lg border border-dashed p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary" /> Fill from your resume
          </p>
          <p className="text-xs text-muted-foreground">
            Upload a PDF or paste the text. We suggest the fields below; review them, then save. The resume itself is
            not stored.
          </p>
        </div>
        <div className="flex shrink-0 rounded-md border p-0.5 text-xs" role="tablist" aria-label="Import from">
          {(["pdf", "text"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => {
                setMode(value);
                setLocalError(null);
                parse.reset();
              }}
              className={cn(
                "rounded px-2 py-1",
                mode === value ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {value === "pdf" ? "PDF" : "Paste text"}
            </button>
          ))}
        </div>
      </div>

      {mode === "pdf" ? (
        <div className="flex items-center gap-3">
          <input
            ref={fileInput}
            id="resume_file"
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            <FileText className="size-4" /> {file ? "Change PDF" : "Choose PDF"}
          </Button>
          <span className="text-xs text-muted-foreground truncate">{file ? file.name : "Up to 2 MB"}</span>
        </div>
      ) : (
        <Textarea
          id="resume_text"
          rows={5}
          maxLength={20000}
          placeholder="Paste your resume, or copy everything from your LinkedIn profile page."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            parse.reset();
          }}
        />
      )}

      {hasExisting && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
          Replace fields I already filled in
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="button"
        size="sm"
        disabled={!ready || parse.isPending}
        onClick={() => parse.mutate(mode === "pdf" && file ? { file } : { text })}
      >
        {parse.isPending && <Loader2 className="size-4 animate-spin" />}
        {parse.isPending ? "Reading..." : "Fill my profile"}
      </Button>
    </div>
  );
}
