/**
 * verify-production-env.mjs
 * 
 * Verifies all required environment variables are set for production deployment.
 * This script should be run before deploying to production.
 */

import process from "node:process";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVar(name, required = true, sensitive = false) {
  const value = process.env[name];
  const exists = value && value.trim() !== "";
  
  if (exists) {
    const displayValue = sensitive ? "***" : value.substring(0, 20) + "...";
    log(`  ✅ ${name}: ${displayValue}`, "green");
    return true;
  } else {
    if (required) {
      log(`  ❌ ${name}: MISSING (REQUIRED)`, "red");
      return false;
    } else {
      log(`  ⚠️  ${name}: Not set (optional)`, "yellow");
      return true;
    }
  }
}

async function main() {
  log("\n🔍 Production Environment Variables Verification", "cyan");
  log("=".repeat(60), "cyan");
  
  let allRequired = true;
  
  // Supabase
  log("\n📦 Supabase Configuration", "blue");
  allRequired &= checkEnvVar("NEXT_PUBLIC_SUPABASE_URL", true);
  allRequired &= checkEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", true, true);
  allRequired &= checkEnvVar("SUPABASE_SERVICE_ROLE_KEY", true, true);
  allRequired &= checkEnvVar("SUPABASE_DB_URL", true, true);
  
  // Redis (Upstash)
  log("\n🔴 Redis / Rate Limiting (Upstash)", "blue");
  allRequired &= checkEnvVar("UPSTASH_REDIS_REST_URL", true);
  allRequired &= checkEnvVar("UPSTASH_REDIS_REST_TOKEN", true, true);
  
  // Payments (Iyzico)
  log("\n💳 Payments (Iyzico)", "blue");
  allRequired &= checkEnvVar("IYZICO_API_KEY", true, true);
  allRequired &= checkEnvVar("IYZICO_SECRET_KEY", true, true);
  allRequired &= checkEnvVar("IYZICO_BASE_URL", true);
  
  // Email (Resend)
  log("\n📧 Email (Resend)", "blue");
  allRequired &= checkEnvVar("RESEND_API_KEY", true, true);
  allRequired &= checkEnvVar("RESEND_FROM_EMAIL", true);
  
  // Monitoring (Sentry)
  log("\n📊 Monitoring (Sentry)", "blue");
  allRequired &= checkEnvVar("NEXT_PUBLIC_SENTRY_DSN", true);
  allRequired &= checkEnvVar("SENTRY_AUTH_TOKEN", true, true);
  
  // Security
  log("\n🔒 Security", "blue");
  allRequired &= checkEnvVar("INTERNAL_API_SECRET", true, true);
  allRequired &= checkEnvVar("CRON_SECRET", true, true);
  
  // Optional
  log("\n🔧 Optional Configuration", "blue");
  checkEnvVar("NEXT_PUBLIC_TURNSTILE_SITE_KEY", false);
  checkEnvVar("TURNSTILE_SECRET_KEY", false, true);
  checkEnvVar("NEXT_PUBLIC_APP_URL", false);
  checkEnvVar("NEXT_PUBLIC_ENABLE_BILLING", false);
  checkEnvVar("NEXT_PUBLIC_ENABLE_AI", false);
  checkEnvVar("NEXT_PUBLIC_ENABLE_CHAT", false);
  
  // Summary
  log("\n" + "=".repeat(60), "cyan");
  
  if (allRequired) {
    log("✅ All required environment variables are set!", "green");
    log("\n🚀 Ready for production deployment", "green");
    process.exit(0);
  } else {
    log("❌ Some required environment variables are missing!", "red");
    log("\n📝 Please set the missing variables in Vercel:", "yellow");
    log("   1. Go to: https://vercel.com/your-team/oto-burada/settings/environment-variables", "yellow");
    log("   2. Add the missing variables", "yellow");
    log("   3. Redeploy the application", "yellow");
    process.exit(1);
  }
}

main().catch((err) => {
  log(`\n❌ Error: ${err.message}`, "red");
  process.exit(1);
});
