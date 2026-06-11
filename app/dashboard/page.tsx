"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generationService } from "@/lib/generation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratedMessageCard } from "@/components/generated-message-card";

export default function DashboardPage() {
  const [form, setForm] = useState({ name: "", company: "", role: "" });

  const mutation = useMutation({
    mutationFn: generationService.connectionRequest,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Connection Request</h2>
        <p className="text-sm text-muted-foreground">Generate a personalized LinkedIn connection request.</p>
      </div>

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
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Generating..." : "Generate Message"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {mutation.isError && <p className="text-sm text-destructive">Failed to generate. Try again.</p>}
      {mutation.data?.message && <GeneratedMessageCard message={mutation.data.message} />}
    </div>
  );
}
