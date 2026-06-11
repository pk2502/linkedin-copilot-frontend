import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-border">
        <span className="text-base font-semibold tracking-tight">LinkedIn Copilot</span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-foreground text-background px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
            <span className="size-1.5 rounded-full bg-green-500 inline-block"></span>
            Powered by local AI — your data stays private
          </div>

          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            Write better LinkedIn messages,{" "}
            <span className="text-muted-foreground">in seconds</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Generate personalized connection requests, referral asks, recruiter replies,
            and follow-ups — powered by AI.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="bg-foreground text-background px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="border border-border px-6 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl w-full">
          {[
            { title: "Connection Request", desc: "Reach out to new contacts" },
            { title: "Referral Request", desc: "Ask for job referrals" },
            { title: "Recruiter Reply", desc: "Respond to recruiters" },
            { title: "Follow-Up", desc: "Re-engage connections" },
          ].map((f) => (
            <div
              key={f.title}
              className="border border-border rounded-lg p-4 text-left space-y-1"
            >
              <p className="text-sm font-medium">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-border text-center text-xs text-muted-foreground">
        LinkedIn Copilot — AI networking assistant
      </footer>
    </div>
  );
}
