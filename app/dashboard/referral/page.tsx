"use client";

import { useState } from "react";
import { streamingService } from "@/lib/generation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratedMessageCard } from "@/components/generated-message-card";
import { ToneSelector, Tone } from "@/components/tone-selector";

export default function ReferralPage() {
  const [form, setForm] = useState({
    name: "", company: "", role: "", job_title: "", your_background: "",
  });
  const [tone, setTone] = useState<Tone>("friendly");
  const [message, setMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError(false);
    setIsStreaming(true);
    try {
      await streamingService.referralRequest({ ...form, tone }, (chunk) => {
        setMessage((prev) => prev + chunk);
      });
    } catch {
      setError(true);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Referral Request</h2>
        <p className="text-sm text-muted-foreground">Ask someone to refer you for a job opening.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>Fill in the referrer's info and the role you're applying for.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Referrer's Name</Label>
              <Input id="name" placeholder="Jane Smith" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Corp" value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Referrer's Role</Label>
              <Input id="role" placeholder="Senior Engineer" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job_title">Job Title You're Applying For</Label>
              <Input id="job_title" placeholder="Frontend Engineer" value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="your_background">Your Background</Label>
              <Textarea id="your_background" placeholder="3 years React experience..." value={form.your_background}
                rows={3} onChange={(e) => setForm({ ...form, your_background: e.target.value })} required />
            </div>
            <ToneSelector value={tone} onChange={setTone} />
            <Button type="submit" disabled={isStreaming} className="w-full">
              {isStreaming ? "Generating..." : "Generate Message"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {error && <p className="text-sm text-destructive">Failed to generate. Try again.</p>}
      {(message || isStreaming) && <GeneratedMessageCard message={message} isStreaming={isStreaming} />}
    </div>
  );
}
