"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { contactService, followUpHref } from "@/lib/contacts";

/** Dashboard card listing who is due a follow-up; hidden when nobody is. */
export function FollowUpsDue() {
  const { data } = useQuery({ queryKey: ["contacts-due"], queryFn: () => contactService.list({ due: "1" }) });
  if (!data?.length) return null;

  const shown = data.slice(0, 3);
  return (
    <div className="rounded-lg border border-foreground/30 px-4 py-3 space-y-2">
      <p className="text-sm font-medium flex items-center gap-2">
        <BellRing className="size-4" />
        {data.length} follow-up{data.length === 1 ? "" : "s"} due
      </p>
      <ul className="space-y-1">
        {shown.map((contact) => (
          <li key={contact.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate">
              {contact.name}
              {contact.company && <span className="text-muted-foreground"> · {contact.company}</span>}
              <span className="text-muted-foreground"> · sent {contact.days_since_sent ?? 0}d ago</span>
            </span>
            <Link href={followUpHref(contact)} className="shrink-0 underline underline-offset-4">
              Write follow-up
            </Link>
          </li>
        ))}
      </ul>
      {data.length > shown.length && (
        <Link href="/dashboard/tracker" className="text-sm text-muted-foreground underline underline-offset-4">
          See all {data.length}
        </Link>
      )}
    </div>
  );
}
