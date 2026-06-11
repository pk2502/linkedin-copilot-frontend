"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generationService } from "@/lib/generation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratedMessageCard } from "@/components/generated-message-card";

const INTEREST_LEVELS = [
  { value: "very interested", label: "Very Interested" },
  { value: "somewhat interested", label: "Somewhat Interested" },
  { value: "not interested", label: "Not Interested" },
];

export default function RecruiterPage() {
  const [form, setForm] = useState({
    recruiter_name: "",
    company: "",
    job_title: "",
    your_background: "",
    interest_level: "very interested",
  });

  const mutation = useMutation({
    mutationFn: generationService.recruiterReply,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Recruiter Reply</h2>
        <p className="text-sm text-muted-foreground">Reply professionally to a recruiter's message.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>Fill in the recruiter and job details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="recruiter_name">Recruiter's Name</Label>
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
              <Label htmlFor="your_background">Your Background</Label>
              <Textarea id="your_background" placeholder="3 years React experience, built SaaS products..."
                value={form.your_background} rows={3}
                onChange={(e) => setForm({ ...form, your_background: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="interest_level">Interest Level</Label>
              <select
                id="interest_level"
                value={form.interest_level}
                onChange={(e) => setForm({ ...form, interest_level: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {INTEREST_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Generating..." : "Generate Reply"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {mutation.isError && <p className="text-sm text-destructive">Failed to generate. Try again.</p>}
      {mutation.data?.message && <GeneratedMessageCard message={mutation.data.message} />}
    </div>
  );
}
