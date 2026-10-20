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

export default function FollowupPage() {
  const [form, setForm] = useState({
    name: "", company: "", role: "", context: "", days_since: "",
  });
  const [tone, setTone] = useState<Tone>("friendly");
  const { result, loading, error, generate } = useDraft("followup");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(form, tone);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Follow-Up Message</h2>
        <p className="text-sm text-muted-foreground">Re-engage a connection after a previous interaction.</p>
      </div>
      <ProfileNudge />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>Describe your previous interaction and who you&apos;re following up with.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Their Name</Label>
              <Input id="name" placeholder="Jane Smith" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Corp" value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Their Role</Label>
              <Input id="role" placeholder="Senior Engineer" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="context">Previous Interaction</Label>
              <Textarea id="context" placeholder="We spoke at a conference about React performance..."
                value={form.context} rows={3}
                onChange={(e) => setForm({ ...form, context: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="days_since">Days Since Last Contact</Label>
              <Input id="days_since" type="number" placeholder="7" value={form.days_since}
                onChange={(e) => setForm({ ...form, days_since: e.target.value })} required />
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
