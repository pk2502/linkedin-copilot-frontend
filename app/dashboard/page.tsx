"use client";

import { useState } from "react";
import { useDraft } from "@/hooks/use-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DraftVariants } from "@/components/draft-variants";
import { ProfileNudge } from "@/components/profile-nudge";
import { ToneSelector, Tone } from "@/components/tone-selector";

export default function DashboardPage() {
  const [form, setForm] = useState({ name: "", company: "", role: "" });
  const [tone, setTone] = useState<Tone>("friendly");
  const { result, loading, error, generate } = useDraft("connection_request");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(form, tone);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Connection Request</h2>
        <p className="text-sm text-muted-foreground">Generate a personalized LinkedIn connection request.</p>
      </div>

      <ProfileNudge />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Details</CardTitle>
          <CardDescription>Enter the details of the person you want to connect with.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Jane Smith" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Corp" value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Role</Label>
              <Input id="role" placeholder="Senior Engineer" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })} required />
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
