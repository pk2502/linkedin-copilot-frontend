"use client";

import { Suspense } from "react";
import { Composer } from "@/components/composer";
import { OnboardingChecklist } from "@/components/onboarding-checklist";

export default function DashboardPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">New message</h2>
        <p className="text-sm text-muted-foreground">
          Pick what you&apos;re writing, add a few details, and get three drafts in your voice.
        </p>
      </div>

      <OnboardingChecklist />

      {/* The composer reads ?type= from the URL. */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
        <Composer />
      </Suspense>
    </div>
  );
}
