/**
 * Environment Validation for Web Push Services
 * Supplies safe accessor patterns and boolean capability flags.
 */

export function hasWebPushEnv(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  return Boolean(publicKey && privateKey && subject);
}

export function getWebPushEnv() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "Missing VAPID Configuration. Ensure NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT are defined."
    );
  }

  return {
    publicKey,
    privateKey,
    subject,
  };
}
