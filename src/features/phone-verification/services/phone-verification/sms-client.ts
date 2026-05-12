import "server-only";

export interface SMSMessage {
  to: string;
  body: string;
}

export interface SMSSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSClient {
  send(msg: SMSMessage): Promise<SMSSendResult>;
}

function maskPhoneNumber(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");

  if (digits.length <= 4) {
    return "***";
  }

  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

/**
 * Simulation / Mock Client used when no API keys exist or explicit test mode is active.
 * Strictly complies with "Zero-Cost / Free-Tier Only" mandates.
 */
class ConsoleSMSClient implements SMSClient {
  async send(msg: SMSMessage): Promise<SMSSendResult> {
    if (process.env.NODE_ENV !== "production") {
      console.log("--- [SIMULATED SMS OUTBOX] ---");
      console.log(`To: ${maskPhoneNumber(msg.to)}`);
      console.log(`Body: [redacted:${msg.body.length} chars]`);
      console.log("------------------------------");
    }
    return {
      success: true,
      messageId: `sim-${Date.now()}`,
    };
  }
}

/**
 * Placeholder for real-tier adapters (e.g. Twilio, Infobip, Netgsm).
 * Currently falls back safely to simulation to ensure production resilience without breaking flows.
 */
class DefaultSMSClient implements SMSClient {
  async send(msg: SMSMessage): Promise<SMSSendResult> {
    // Placeholder condition for environment variable triggers
    const hasCredentials = false; // FUTURE: process.env.SMS_API_KEY && ...

    if (!hasCredentials) {
      const fallback = new ConsoleSMSClient();
      return fallback.send(msg);
    }

    // FUTURE: Actual provider invoke logic goes here.
    return {
      success: false,
      error: "Real SMS provider not configured yet.",
    };
  }
}

// Factory/Singleton access
let defaultClientInstance: SMSClient | null = null;

export function getSMSClient(): SMSClient {
  if (!defaultClientInstance) {
    defaultClientInstance = new DefaultSMSClient();
  }
  return defaultClientInstance;
}
