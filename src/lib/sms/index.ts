import type { SMSMessage, SMSProvider, SMSResponse } from "./types";
import { TwilioProvider } from "@/lib/sms/twilio";

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
        console.error(`SMS Provider Error: ${result.error}`);
        // If Twilio fails, we could potentially try another fallback here, 
        // but for now, we'll just ensure it doesn't throw.
      }
      
      return result;
    } catch (error) {
      console.error("SMS Infrastructure Error:", error);
      return { success: false, error: "SMS sistemi geçici olarak servis dışı." };
    }
  }
}

export const sms = new SMSManager();
