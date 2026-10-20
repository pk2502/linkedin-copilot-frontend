"use client";

import { useState } from "react";
import { useDraft } from "@/hooks/use-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DraftVariants } from "@/components/draft-variants";
import { ProfileNudge } from "@/components/profile-nudge";
import { ToneSelector, Tone } from "@/components/tone-selector";

const INTEREST_LEVELS = [
  { value: "very interested", label: "Very Interested" },
  { value: "somewhat interested", label: "Somewhat Interested" },
  { value: "not interested", label: "Not Interested" },
];

export default function RecruiterPage() {
  const [form, setForm] = useState({
    recruiter_name: "", company: "", job_title: "", your_background: "", interest_level: "very interested",
  });
  const [tone, setTone] = useState<Tone>("friendly");
  const { result, loading, error, generate } = useDraft("recruiter_reply");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(form, tone);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Recruiter Reply</h2>
        <p className="text-sm text-muted-foreground">Reply professionally to a recruiter&apos;s message.</p>
      </div>
      <ProfileNudge />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>Fill in the recruiter and job details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="recruiter_name">Recruiter&apos;s Name</Label>
              <Input id="recruiter_name" placeholder="John Doe" value={form.recruiter_name}
                onChange={(e) => setForm({ ...form, recruiter_name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Corp" value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job_title">Job Title</Label>
              <Input id="job_title" placeholder="Frontend Engineer" value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="your_background">Your Background <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="your_background" placeholder="Leave empty to use your profile, or add details for this role" value={form.your_background}
                rows={3} onChange={(e) => setForm({ ...form, your_background: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="interest_level">Interest Level</Label>
              <select id="interest_level" value={form.interest_level}
                onChange={(e) => setForm({ ...form, interest_level: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                {INTEREST_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
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
