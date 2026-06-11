"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { historyService, Generation } from "@/lib/history";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Copy, Trash2, Check, Search } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  connection_request: "Connection Request",
  referral_request: "Referral Request",
  recruiter_reply: "Recruiter Reply",
  followup: "Follow-Up",
};

function GenerationItem({ item, onDelete }: { item: Generation; onDelete: (id: number) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const date = new Date(item.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-medium">
              {TYPE_LABELS[item.generation_type] ?? item.generation_type}
            </CardTitle>
            <CardDescription className="text-xs">{date}</CardDescription>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}
              className="text-destructive hover:text-destructive">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{item.output}</p>
      </CardContent>
    </Card>
  );
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["history", searchQuery],
    queryFn: () => historyService.list(searchQuery || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: historyService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["history"] }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Generations</h2>
        <p className="text-sm text-muted-foreground">All your past AI-generated messages.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="outline" size="sm">
          <Search className="size-4" />
        </Button>
      </form>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="h-24 animate-pulse bg-muted rounded-md" />
            </Card>
          ))}
        </div>
      )}

      {isError && <p className="text-sm text-destructive">Failed to load history.</p>}

      {data && data.length === 0 && (
        <p className="text-sm text-muted-foreground">No generations found.</p>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((item) => (
            <GenerationItem
              key={item.id}
              item={item}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
