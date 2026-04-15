import type { SMSMessage, SMSProvider, SMSResponse } from "./types";
import { TwilioProvider } from "@/lib/sms/twilio";
import { logger } from "@/lib/utils/logger";

class ConsoleProvider implements SMSProvider {
  async send(message: SMSMessage): Promise<SMSResponse> {
    console.log(`[SMS FALLBACK LOG] to: ${message.to}, body: ${message.body}`);
    return { success: true, messageId: `console_${Date.now()}` };
  }
}

class SMSManager {
  private provider: SMSProvider;
  private isDevelopment = process.env.NODE_ENV === "development";

  constructor() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.provider = new TwilioProvider();
    } else {
      // Always fallback to console instead of null to prevent "breaks"
      this.provider = new ConsoleProvider();
    }
  }

  async send(message: SMSMessage): Promise<SMSResponse> {
    try {
      if (this.isDevelopment && !process.env.FORCE_SMS) {
        console.log(`[SMS DEV MOCK] to: ${message.to}, body: ${message.body}`);
        return { success: true, messageId: "mock_id" };
      }

      const result = await this.provider.send(message);
      
      if (!result.success) {
        logger.sms.error("SMS provider returned failure", undefined, { error: result.error });
      }
      
      return result;
    } catch (error) {
      logger.sms.error("SMS infrastructure error", error);
      return { success: false, error: "SMS sistemi geçici olarak servis dışı." };
    }
  }
}

export const sms = new SMSManager();
