"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, PlugZap, XCircle } from "lucide-react";
import { authService } from "@/lib/auth";
import {
  ExtensionNotFoundError,
  connectExtension,
  detectExtension,
} from "@/lib/extension-connect";
import { getAccessToken } from "@/lib/tokens";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Status = "checking" | "no-extension" | "signed-out" | "connecting" | "connected" | "error";

const LOGIN_URL = "/login?next=/connect-extension";

/** Detect the extension, then hand it a session. Reports progress via `report`. */
async function connectFlow(report: (status: Status) => void): Promise<void> {
  try {
    // Detect first: tokens are only minted when the extension is listening.
    await detectExtension(window);
  } catch {
    report("no-extension");
    return;
  }

  if (!getAccessToken()) {
    report("signed-out");
    return;
  }

  report("connecting");
  try {
    await connectExtension(window, authService.extensionToken, { detectTimeoutMs: 1500 });
    report("connected");
  } catch (error) {
    // An expired web session redirects to /login via the axios interceptor.
    report(error instanceof ExtensionNotFoundError ? "no-extension" : "error");
  }
}

export default function ConnectExtensionPage() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;
    connectFlow((next) => {
      if (active) setStatus(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const retry = () => {
    setStatus("checking");
    connectFlow(setStatus);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="size-5" />
          Connect the ConnectPilot extension
        </CardTitle>
        <CardDescription>
          Sign the browser extension in with your account. It gets its own session, so signing out here
          does not sign it out.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {(status === "checking" || status === "connecting") && (
          <p className="flex items-center gap-2 text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" />
            {status === "checking" ? "Looking for the extension…" : "Connecting…"}
          </p>
        )}

        {status === "connected" && (
          <div className="space-y-1" role="status">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4 text-green-600" />
              Extension connected
            </p>
            <p className="text-muted-foreground">
              You can close this tab. Open a LinkedIn profile and click the ConnectPilot icon.
            </p>
          </div>
        )}

        {status === "signed-out" && (
          <p className="text-muted-foreground">Sign in to your account first, then you will come back here.</p>
        )}

        {status === "no-extension" && (
          <div className="space-y-1">
            <p className="flex items-center gap-2 font-medium">
              <XCircle className="size-4 text-destructive" />
              Extension not detected
            </p>
            <p className="text-muted-foreground">
              Install or reload the ConnectPilot extension (version 1.1 or later), then try again.
            </p>
          </div>
        )}

        {status === "error" && (
          <p className="flex items-center gap-2 text-destructive">
            <XCircle className="size-4" />
            Could not connect the extension. Try again.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {status === "signed-out" && (
          <Link href={LOGIN_URL} className={buttonVariants({ className: "w-full" })}>
            Sign in
          </Link>
        )}
        {(status === "no-extension" || status === "error") && (
          <Button className="w-full" onClick={retry}>
            Try again
          </Button>
        )}
        {status === "connected" && (
          <Link href="/dashboard" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Go to dashboard
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
