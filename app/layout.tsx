import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ConnectPilot — AI LinkedIn Message Drafts",
  description: "Generate personalized LinkedIn connection requests, referral asks, recruiter replies, and follow-ups in seconds. Powered by AI.",
  keywords: ["LinkedIn", "AI", "networking", "job search", "connection request", "referral"],
  openGraph: {
    title: "ConnectPilot — AI LinkedIn Message Drafts",
    description: "Write better LinkedIn messages in seconds with AI.",
    url: "https://connect-pilot.vercel.app",
    siteName: "ConnectPilot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ConnectPilot — AI LinkedIn Message Drafts",
    description: "Write better LinkedIn messages in seconds with AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
