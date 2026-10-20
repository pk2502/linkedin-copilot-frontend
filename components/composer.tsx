"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DraftVariants } from "@/components/draft-variants";
import { ToneSelector, type Tone } from "@/components/tone-selector";
import { useDraft } from "@/hooks/use-draft";
import {
  EMPTY_FORM,
  INTEREST_LEVELS,
  TYPE_SPECS,
  buildPayload,
  isRequired,
  parseType,
  specFor,
  type ComposerForm,
  type FieldSpec,
} from "@/lib/composer";
import type { DraftType } from "@/lib/drafts";
import { cn } from "@/lib/utils";

/** One form for every message type; the type lives in ?type= so links work. */
export function Composer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = parseType(searchParams.get("type"));
  const spec = specFor(type);

  const [form, setForm] = useState<ComposerForm>(EMPTY_FORM);
  const [tone, setTone] = useState<Tone>("friendly");
  const { result, loading, error, generate, reset } = useDraft(type);

  const selectType = (next: DraftType) => {
    if (next === type) return;
    reset();
    router.replace(`${pathname}?type=${next}`, { scroll: false });
  };

  const set = (key: keyof ComposerForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Message type">
        {TYPE_SPECS.map((option) => (
          <button
            key={option.type}
            type="button"
            role="tab"
            aria-selected={option.type === type}
            onClick={() => selectType(option.type)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              option.type === type
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/50",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{spec.label}</CardTitle>
          <CardDescription>{spec.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              generate(buildPayload(type, form), tone);
            }}
          >
            {spec.fields.map((field) => (
              <Field key={field.key} field={field} form={form} onChange={set} />
            ))}
            <ToneSelector value={tone} onChange={setTone} />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Writing 3 drafts..." : "Generate 3 Drafts"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <DraftVariants result={result} loading={loading} />
    </div>
  );
}

function Field({
  field,
  form,
  onChange,
}: {
  field: FieldSpec;
  form: ComposerForm;
  onChange: (key: keyof ComposerForm, value: string) => void;
}) {
  const required = isRequired(field, form);
  const value = form[field.key];
  const label = (
    <Label htmlFor={field.key}>
      {field.label}
      {!required && field.kind !== "interest" && (
        <span className="font-normal text-muted-foreground"> (optional)</span>
      )}
    </Label>
  );

  if (field.kind === "interest") {
    return (
      <div className="space-y-1">
        {label}
        <div className="flex gap-2" id={field.key} role="radiogroup">
          {INTEREST_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              role="radio"
              aria-checked={value === level.value}
              onClick={() => onChange(field.key, level.value)}
              className={cn(
                "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                value === level.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/50",
              )}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const common = {
    id: field.key,
    value,
    required,
    placeholder: field.placeholder,
    maxLength: field.maxLength,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(field.key, e.target.value),
  };

  return (
    <div className="space-y-1">
      {label}
      {field.kind === "textarea" ? (
        <Textarea rows={field.rows} {...common} />
      ) : (
        <Input type={field.kind === "number" ? "number" : "text"} min={field.kind === "number" ? 0 : undefined} {...common} />
      )}
      {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
    </div>
  );
}
