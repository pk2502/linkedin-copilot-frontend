"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { PROFILE_NUDGE_BELOW, profileService } from "@/lib/profile";

/** Suggests completing the profile while it is too thin to personalise drafts. */
export function ProfileNudge() {
  const { data } = useQuery({ queryKey: ["profile"], queryFn: profileService.get });
  if (!data || data.completeness >= PROFILE_NUDGE_BELOW) return null;

  return (
    <Link
      href="/dashboard/profile"
      className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm hover:bg-muted transition-colors"
    >
      <UserRound className="size-4 shrink-0" />
      <span>
        <span className="font-medium">Your profile is {data.completeness}% complete.</span>{" "}
        <span className="text-muted-foreground">Add it once and every draft is written with your background.</span>
      </span>
    </Link>
  );
}
