import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — ConnectPilot",
  description: "What ConnectPilot collects, why, who processes it, and how to have it deleted.",
};

const CONTACT_EMAIL = "paritoshkhubchandani2@gmail.com";
const LAST_UPDATED = "17 October 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 py-4 border-b border-border">
        <Link href="/" className="text-base font-semibold tracking-tight">
          ConnectPilot
        </Link>
      </header>

      <main className="flex-1 px-6 py-12">
        <article className="max-w-2xl mx-auto space-y-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated {LAST_UPDATED}</p>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            ConnectPilot drafts LinkedIn messages with AI. You review every draft and send it yourself;
            ConnectPilot never posts, sends or clicks anything on LinkedIn for you. This policy covers the
            web app at li-copilot.vercel.app and the ConnectPilot Chrome extension.
          </p>

          <Section title="What we collect">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Account details.</strong> Your username, email address and
                password (stored only as a salted hash). If you sign in with Google, we receive your Google
                account&apos;s name, email address and account identifier.
              </li>
              <li>
                <strong className="text-foreground">What you ask us to draft.</strong> The details you enter
                for a message (for example a recipient&apos;s name, company and role, the job you are applying
                for, your background, or context for a follow-up), the tone you choose, and the draft that is
                generated. These are saved to your history so you can find and reuse them.
              </li>
              <li>
                <strong className="text-foreground">Your display name</strong> (or username) is included in
                the request so the draft can be signed as you.
              </li>
              <li>
                <strong className="text-foreground">Technical data.</strong> Our hosting providers keep
                standard server logs, such as IP address, time and requested URL, for security and
                troubleshooting. We use your IP address and account to enforce rate limits. We do not use
                analytics or advertising trackers.
              </li>
            </ul>
          </Section>

          <Section title="The Chrome extension">
            <p>
              When you open the extension on a LinkedIn profile, it reads the name, role and company shown on
              that page to pre-fill the form. This happens only when you open it, only on the page you are
              viewing, and nothing is sent anywhere until you click Generate. You can edit or clear the fields
              first. The extension does not read your messages, connections or browsing history, and it does
              not run in the background.
            </p>
            <p>
              The extension stores its sign-in tokens in Chrome&apos;s local extension storage on your device.
              The web app stores its sign-in tokens in your browser&apos;s local storage and sets one cookie
              that only records that you are signed in.
            </p>
          </Section>

          <Section title="How we use it">
            <p>
              Only to provide ConnectPilot: to sign you in, generate drafts, show your history, keep the
              service secure and enforce usage limits. We do not sell your data, use it for advertising, or
              share it with data brokers, and we do not use it to build profiles of the people you write to.
            </p>
          </Section>

          <Section title="Who processes it">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Groq</strong> generates the drafts. The details of each
                request are sent to Groq&apos;s API for that purpose, under Groq&apos;s terms.
              </li>
              <li>
                <strong className="text-foreground">Render</strong> hosts the API and{" "}
                <strong className="text-foreground">Supabase</strong> hosts the database (both in Singapore).
              </li>
              <li>
                <strong className="text-foreground">Vercel</strong> hosts the web app.
              </li>
              <li>
                <strong className="text-foreground">Google</strong> handles Google sign-in if you choose it.
              </li>
            </ul>
            <p>We share data with these providers only as needed to run the service.</p>
          </Section>

          <Section title="Retention and deletion">
            <p>
              Drafts stay in your history until you delete them, which you can do at any time from the History
              page. Your account and its data are kept until you ask us to delete them. To delete your account
              and everything associated with it, or to get a copy of your data, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4 text-foreground">
                {CONTACT_EMAIL}
              </a>{" "}
              from the address on your account. Signing out of the web app or the extension revokes that
              session.
            </p>
          </Section>

          <Section title="Security">
            <p>
              All traffic uses HTTPS. Passwords are hashed, sign-in tokens expire and are rotated, and access to
              each account&apos;s data is limited to that account.
            </p>
          </Section>

          <Section title="Children">
            <p>ConnectPilot is not intended for anyone under 16.</p>
          </Section>

          <Section title="Changes">
            <p>
              If this policy changes, the new version will be posted here with a new date. Material changes
              will be highlighted in the app.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions or requests:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4 text-foreground">
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </article>
      </main>

      <footer className="px-8 py-5 border-t border-border text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          ← Back to ConnectPilot
        </Link>
      </footer>
    </div>
  );
}
