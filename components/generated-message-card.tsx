"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check } from "lucide-react";

interface GeneratedMessageCardProps {
  message: string;
  isStreaming?: boolean;
}

export function GeneratedMessageCard({ message, isStreaming = false }: GeneratedMessageCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Generated Message</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleCopy} disabled={isStreaming}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Textarea
            value={message}
            readOnly
            rows={5}
            className="resize-none"
          />
          {isStreaming && (
            <span className="absolute bottom-3 right-3 inline-block w-2 h-4 bg-foreground animate-pulse rounded-sm" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
