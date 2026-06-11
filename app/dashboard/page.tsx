"use client";

import { useState } from "react";
import { streamingService } from "@/lib/generation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratedMessageCard } from "@/components/generated-message-card";
import { ToneSelector, Tone } from "@/components/tone-selector";

export default function DashboardPage() {
  const [form, setForm] = useState({ name: "", company: "", role: "" });
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
      await streamingService.connectionRequest({ ...form, tone }, (chunk) => {
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
            <ToneSelector value={tone} onChange={setTone} />
            <Button type="submit" disabled={isStreaming} className="w-full">
              {isStreaming ? "Generating..." : "Generate Message"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">Failed to generate. Try again.</p>}
      {(message || isStreaming) && (
        <GeneratedMessageCard message={message} isStreaming={isStreaming} />
      )}
    </div>
  );
}
