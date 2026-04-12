export interface SMSMessage {
  to: string;
  body: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSProvider {
  send(message: SMSMessage): Promise<SMSResponse>;
}
