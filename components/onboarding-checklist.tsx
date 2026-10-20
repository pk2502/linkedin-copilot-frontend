"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checklistSteps, onboardingService } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

/** First-run checklist on the dashboard; hidden once every step is done. */
export function OnboardingChecklist() {
  const { data } = useQuery({ queryKey: ["onboarding"], queryFn: onboardingService.get });
  if (!data) return null;

  const steps = checklistSteps(data);
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Get set up</CardTitle>
        <CardDescription>
          {done} of {steps.length} done. Each step makes drafts better and faster.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={step.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  step.done ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground",
                )}
                aria-hidden
              >
                {step.done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", step.done && "text-muted-foreground line-through")}>
                  {step.title}
                  <span className="sr-only">{step.done ? " (done)" : " (to do)"}</span>
                </p>
                {!step.done && <p className="text-xs text-muted-foreground">{step.description}</p>}
              </div>
              {!step.done &&
                (step.external ? (
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-sm font-medium underline underline-offset-4"
                  >
                    {step.action}
                  </a>
                ) : (
                  <Link href={step.href} className="shrink-0 text-sm font-medium underline underline-offset-4">
                    {step.action}
                  </Link>
                ))}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
