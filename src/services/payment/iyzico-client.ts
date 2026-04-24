import iyzipay from "iyzipay";

/**
 * SOLID: Single Responsibility — sadece Iyzico SDK wrapper.
 * Test ve production ortam seçici. Environment variable ile toggle.
 */
export function getIyzicoClient() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const uri = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

  if (!apiKey || !secretKey) {
    console.warn("Iyzico API keys are missing. Payment features will not work.");
  }

  return new iyzipay({
    apiKey: apiKey!,
    secretKey: secretKey!,
    uri: uri,
  });
}

/**
 * Helper to check if Iyzico is configured
 */
export function isIyzicoConfigured() {
  return !!(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY);
}
