"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Search, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  STATUS_LABELS,
  TRACKER_TABS,
  contactService,
  daysFromToday,
  followUpHref,
  statusLine,
  tabParams,
  type Contact,
  type ContactStatus,
  type ContactUpdate,
  type TrackerTab,
} from "@/lib/contacts";
import { draftErrorMessage } from "@/lib/drafts";
import { cn } from "@/lib/utils";

function ContactRow({ contact }: { contact: Contact }) {
  const queryClient = useQueryClient();
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(contact.notes);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["contacts-due"] });
  };
  const update = useMutation({
    mutationFn: (changes: ContactUpdate) => contactService.update(contact.id, changes),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: () => contactService.remove(contact.id), onSuccess: refresh });
  const busy = update.isPending || remove.isPending;
  const error = update.isError ? draftErrorMessage(update.error) : remove.isError ? draftErrorMessage(remove.error) : null;

  return (
    <Card className={cn(contact.follow_up_due && "border-foreground/40")}>
      <CardContent className="space-y-3 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium flex items-center gap-1.5">
              {contact.name}
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`${contact.name} on LinkedIn`}
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {[contact.role, contact.company].filter(Boolean).join(" at ") || "No company yet"}
            </p>
            <p className={cn("text-xs mt-1", contact.follow_up_due ? "font-medium" : "text-muted-foreground")}>
              {statusLine(contact)}
            </p>
          </div>
          <select
            aria-label={`Status for ${contact.name}`}
            value={contact.status}
            disabled={busy}
            onChange={(e) => update.mutate({ status: e.target.value as ContactStatus })}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {(Object.keys(STATUS_LABELS) as ContactStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {contact.notes && !notesOpen && <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>}
        {notesOpen && (
          <div className="space-y-2">
            <Textarea
              aria-label={`Notes for ${contact.name}`}
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() => update.mutate({ notes }, { onSuccess: () => setNotesOpen(false) })}
              >
                Save notes
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNotesOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(contact.status === "sent" || contact.status === "replied") && (
            <Link href={followUpHref(contact)} className={buttonVariants({ size: "sm" })}>
              Write follow-up
            </Link>
          )}
          {contact.status === "drafted" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => update.mutate({ status: "sent" })}>
              Mark as sent
            </Button>
          )}
          {contact.follow_up_due && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => update.mutate({ follow_up_on: daysFromToday(3) })}
            >
              Snooze 3 days
            </Button>
          )}
          {contact.status !== "done" && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => update.mutate({ status: "done", outcome: "positive" })}
              >
                Worked out
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => update.mutate({ status: "done", outcome: "negative" })}
              >
                No luck
              </Button>
            </>
          )}
          {!notesOpen && (
            <Button size="sm" variant="ghost" onClick={() => setNotesOpen(true)}>
              {contact.notes ? "Edit notes" : "Add notes"}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            aria-label={`Delete ${contact.name}`}
            onClick={() => remove.mutate()}
            className="ml-auto text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

const EMPTY: Record<TrackerTab, string> = {
  due: "No follow-ups due. ConnectPilot reminds you 5 days after you send a message without a reply.",
  sent: "Nobody waiting. Messages you insert from the extension, or mark as sent, show up here.",
  replied: "No replies yet.",
  drafted: "No drafts waiting to be sent.",
  done: "Nothing finished yet.",
  all: "No one tracked yet. Every draft you write adds the person here.",
};

export default function TrackerPage() {
  const [tab, setTab] = useState<TrackerTab>("due");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["contacts", tab, search],
    queryFn: () => contactService.list(tabParams(tab, search)),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tracker</h2>
        <p className="text-sm text-muted-foreground">
          Everyone you&apos;ve written to, and who needs a follow-up. Updated automatically when you draft, insert
          from the extension, or open a conversation where they replied.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tracker view">
        {TRACKER_TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={tab === option.value}
            onClick={() => setTab(option.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              tab === option.value
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:border-foreground/50",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search name, company or notes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <div className="h-40 animate-pulse rounded-xl bg-muted" />}
      {isError && <p className="text-sm text-destructive">Could not load your tracker.</p>}
      {data && data.length === 0 && <p className="text-sm text-muted-foreground">{search ? "No matches." : EMPTY[tab]}</p>}
      <div className="space-y-3">
        {data?.map((contact) => (
          <ContactRow key={contact.id} contact={contact} />
        ))}
      </div>
    </div>
  );
}
