"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResumeImport } from "@/components/resume-import";
import { draftErrorMessage } from "@/lib/drafts";
import { cn } from "@/lib/utils";
import {
  PROFILE_LIMITS,
  mergeParsedProfile,
  profileService,
  type ParsedProfile,
  type ProfileFields,
} from "@/lib/profile";

const FIELDS: {
  key: keyof ProfileFields;
  label: string;
  hint: string;
  placeholder: string;
  rows?: number;
}[] = [
  {
    key: "headline",
    label: "Headline",
    hint: "How you describe yourself in one line.",
    placeholder: "Senior Frontend Engineer at Globex",
  },
  {
    key: "target_roles",
    label: "Roles you're looking for",
    hint: "Used for referral asks and recruiter replies.",
    placeholder: "Staff Frontend Engineer, Frontend Platform Lead",
  },
  {
    key: "skills",
    label: "Key skills",
    hint: "Comma-separated is fine.",
    placeholder: "React, TypeScript, Next.js, design systems",
  },
  {
    key: "summary",
    label: "Summary",
    hint: "A few sentences about your experience and what you do best.",
    placeholder: "Frontend engineer with 8 years in fintech...",
    rows: 4,
  },
  {
    key: "experience",
    label: "Experience highlights",
    hint: "Paste the best parts of your resume: roles, projects, results with numbers. The more concrete, the better the drafts.",
    placeholder: "Led migration of a 40-screen banking app to React...\nBuilt a design system used by 6 teams...",
    rows: 8,
  },
  {
    key: "writing_sample",
    label: "How you write",
    hint: "Paste a message or email you wrote yourself. Drafts copy its voice, not its content.",
    placeholder: "Thanks for the quick reply! Happy to share more...",
    rows: 4,
  },
];

function pickFields(profile: ProfileFields): ProfileFields {
  return Object.fromEntries(FIELDS.map(({ key }) => [key, profile[key] ?? ""])) as ProfileFields;
}

function ProfileForm({ initial, completeness }: { initial: ProfileFields; completeness: number }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileFields>(initial);
  const [saved, setSaved] = useState(false);
  const [imported, setImported] = useState<{ fields: (keyof ParsedProfile)[]; skipped: boolean } | null>(null);

  function applyParsed(parsed: ParsedProfile, replace: boolean) {
    const result = mergeParsedProfile(form, parsed, replace);
    setForm(result.form);
    setImported({ fields: result.changed, skipped: result.kept.length > 0 });
  }

  const save = useMutation({
    mutationFn: profileService.save,
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile"], profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Completeness: {completeness}%</CardTitle>
        <CardDescription>Experience highlights and a writing sample make the biggest difference.</CardDescription>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden" aria-hidden>
          <div className="h-full bg-primary transition-all" style={{ width: `${completeness}%` }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <ResumeImport
          onParsed={applyParsed}
          hasExisting={FIELDS.some(({ key }) => key !== "writing_sample" && form[key].trim())}
        />
        {imported && (
          <p className="text-sm rounded-md bg-muted px-3 py-2" role="status">
            {imported.fields.length
              ? `Filled ${imported.fields.length} field${imported.fields.length === 1 ? "" : "s"}: ${imported.fields
                  .map((key) => FIELDS.find((f) => f.key === key)?.label.toLowerCase())
                  .join(", ")}. Review, then save.`
              : "Nothing new to fill."}
            {imported.skipped && " Fields you already filled in were kept."}
          </p>
        )}
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form);
          }}
        >
          {FIELDS.map(({ key, label, hint, placeholder, rows }) => {
            const limit = PROFILE_LIMITS[key];
            const value = form[key];
            const common = {
              id: key,
              value,
              placeholder,
              maxLength: limit,
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setForm({ ...form, [key]: e.target.value }),
            };
            return (
              <div
                key={key}
                className={cn(
                  "space-y-1",
                  imported?.fields.includes(key as keyof ParsedProfile) && "border-l-2 border-primary pl-3",
                )}
              >
                <div className="flex items-baseline justify-between">
                  <Label htmlFor={key}>{label}</Label>
                  <span className="text-xs text-muted-foreground">
                    {value.length}/{limit}
                  </span>
                </div>
                {rows ? <Textarea rows={rows} {...common} /> : <Input {...common} />}
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
            );
          })}

          {save.isError && (
            <p className="text-sm text-destructive">{draftErrorMessage(save.error) ?? "Could not save."}</p>
          )}
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {saved && <Check className="size-4" />}
            {save.isPending ? "Saving..." : saved ? "Saved" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["profile"], queryFn: profileService.get });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Profile</h2>
        <p className="text-sm text-muted-foreground">
          Filled in once, used in every draft so messages sound like you and cite real details. Only you can see it.
        </p>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="h-96 animate-pulse bg-muted rounded-md" />
        </Card>
      )}
      {isError && <p className="text-sm text-destructive">Could not load your profile.</p>}
      {data && <ProfileForm initial={pickFields(data)} completeness={data.completeness} />}
    </div>
  );
}
