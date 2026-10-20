"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authService } from "@/lib/auth";
import { useAuthStore } from "@/lib/auth.store";
import { callbackUrl, checkCallback, takePending } from "@/lib/linkedin";
import { safeNextPath } from "@/lib/navigation";

function LinkedInCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    // Codes are single-use; React's dev double-effect must not send it twice.
    if (started.current) return;
    started.current = true;

    const pending = takePending();
    const check = checkCallback(new URLSearchParams(searchParams.toString()), pending);
    const signIn = async () => {
      if (!check.ok) throw new Error(check.message);
      try {
        return await authService.linkedinLogin(check.code, callbackUrl(window.location.origin));
      } catch {
        throw new Error("LinkedIn sign-in failed. Try again, or use another sign-in method.");
      }
    };
    signIn()
      .then((data) => {
        setAuth(data.user, data.access, data.refresh);
        router.replace(safeNextPath(pending?.next));
      })
      .catch((err: Error) => setError(err.message));
  }, [router, searchParams, setAuth]);

  if (error) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/login" className="text-sm underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }
  return (
    <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Signing you in with LinkedIn...
    </p>
  );
}

export default function LinkedInCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={null}>
        <LinkedInCallback />
      </Suspense>
    </main>
  );
}
