import Link from "next/link";

const FEATURES = [
  {
    title: "Connection Request",
    desc: "Reach out to new contacts with a personalized message that actually gets accepted.",
    icon: "→",
  },
  {
    title: "Referral Request",
    desc: "Ask for job referrals professionally without feeling awkward.",
    icon: "✦",
  },
  {
    title: "Recruiter Reply",
    desc: "Reply to recruiters with the right tone whether you're interested or not.",
    icon: "◈",
  },
  {
    title: "Follow-Up",
    desc: "Re-engage connections after conferences, interviews, or past conversations.",
    icon: "↺",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Enter profile details", desc: "Paste name, company, and role — or use the Chrome extension to auto-fill from any LinkedIn profile." },
  { step: "2", title: "Choose tone", desc: "Formal, friendly, or concise. The AI adapts the message style to match." },
  { step: "3", title: "Generate & copy", desc: "Your message streams in real-time. Copy it and send — takes less than 10 seconds." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <span className="text-base font-semibold tracking-tight">Li Copilot</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="text-sm bg-foreground text-background px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
            Get started free
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-6 text-center pt-20 pb-16">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
              <span className="size-1.5 rounded-full bg-green-500 inline-block"></span>
              Free to use · No credit card required
            </div>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Write better LinkedIn messages,{" "}
              <span className="text-muted-foreground">in seconds</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              AI-powered generator for connection requests, referral asks, recruiter replies, and follow-ups.
              Stop staring at a blank message box.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/register" className="bg-foreground text-background px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                Get started free
              </Link>
              <Link href="/login" className="border border-border px-6 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors">
                Sign in
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              Also available as a{" "}
              <a href="https://github.com/pk2502/linkedin-copilot-extension" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground transition-colors">
                Chrome Extension
              </a>
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 pb-16 max-w-4xl mx-auto w-full">
          <h2 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">What you can generate</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="border border-border rounded-lg p-5 space-y-2 hover:border-foreground/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-base">{f.icon}</span>
                  <p className="text-sm font-medium">{f.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 pb-20 max-w-3xl mx-auto w-full">
          <h2 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-10">How it works</h2>
          <div className="space-y-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex gap-5">
                <div className="flex-shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {item.step}
                </div>
                <div className="space-y-1 pt-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border px-6 py-16 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Ready to network smarter?</h2>
            <p className="text-sm text-muted-foreground">Free forever. No credit card. Just better messages.</p>
            <Link href="/register" className="inline-block bg-foreground text-background px-8 py-3 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              Start for free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Li Copilot — AI networking assistant</span>
        <div className="flex items-center gap-4">
          <a href="https://github.com/pk2502/linkedin-copilot-extension" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            Chrome Extension
          </a>
          <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
        </div>
      </footer>
    </div>
  );
}
