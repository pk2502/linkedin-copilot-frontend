import type { NextConfig } from "next";

// The four generator pages became one composer at /dashboard?type=...
// Old links and bookmarks keep working.
const OLD_GENERATORS = {
  referral: "referral_request",
  recruiter: "recruiter_reply",
  followup: "followup",
};

const nextConfig: NextConfig = {
  async redirects() {
    return Object.entries(OLD_GENERATORS).map(([path, type]) => ({
      source: `/dashboard/${path}`,
      destination: `/dashboard?type=${type}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
