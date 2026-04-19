import type { NextConfig } from "next";

// Extract the Supabase project hostname from the URL env variable.
// Falls back to the hardcoded value so existing deployments keep working
// without any env changes.
function getSupabaseHostname(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    return new URL(url).hostname;
  } catch {
    // Fallback for existing deployments
    return "yagcxhrhtfhwaxzhyrkj.supabase.co";
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: getSupabaseHostname(),
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85],
    // Image URLs are UUID-based and never change — 1 day cache is safe
    minimumCacheTTL: 86400,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
    // Restore scroll position on back/forward navigation
    scrollRestoration: true,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  serverExternalPackages: ["iyzipay"],
  output: "standalone",
};

export default nextConfig;
