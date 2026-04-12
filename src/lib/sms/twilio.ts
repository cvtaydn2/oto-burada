import type { SMSMessage, SMSProvider, SMSResponse } from "./types";

export class TwilioProvider implements SMSProvider {
  private sid = process.env.TWILIO_ACCOUNT_SID;
  private token = process.env.TWILIO_AUTH_TOKEN;
  private from = process.env.TWILIO_PHONE_NUMBER;

  async send(message: SMSMessage): Promise<SMSResponse> {
    if (!this.sid || !this.token || !this.from) {
      return { success: false, error: "Twilio credentials missing." };
    }

    try {
      // Use standard fetch to avoid extra dependency in MVP if possible, 
      // but Twilio logic is usually better with their SDK. 
      // For lean production, we'll use a fetch-based minimal implementation.
      const auth = Buffer.from(`${this.sid}:${this.token}`).toString("base64");
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.sid}/Messages.json`;

      const params = new URLSearchParams();
      params.append("To", message.to);
      params.append("From", this.from);
      params.append("Body", message.body);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || "Twilio error" };
      }

      return { success: true, messageId: data.sid };
    } catch (error) {
      console.error("Twilio Send Error:", error);
      return { success: false, error: "Twilio bağlantı hatası." };
    }
  }
}
