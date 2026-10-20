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

export default function ReferralPage() {
  const [form, setForm] = useState({
    name: "", company: "", role: "", job_title: "", your_background: "",
  });
  const [tone, setTone] = useState<Tone>("friendly");
  const { result, loading, error, generate } = useDraft("referral_request");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(form, tone);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Referral Request</h2>
        <p className="text-sm text-muted-foreground">Ask someone to refer you for a job opening.</p>
      </div>
      <ProfileNudge />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>Fill in the referrer&apos;s info and the role you&apos;re applying for.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Referrer&apos;s Name</Label>
              <Input id="name" placeholder="Jane Smith" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Corp" value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Referrer&apos;s Role</Label>
              <Input id="role" placeholder="Senior Engineer" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job_title">Job Title You&apos;re Applying For</Label>
              <Input id="job_title" placeholder="Frontend Engineer" value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="your_background">Your Background <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="your_background" placeholder="Leave empty to use your profile, or add details for this role" value={form.your_background}
                rows={3} onChange={(e) => setForm({ ...form, your_background: e.target.value })} />
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
