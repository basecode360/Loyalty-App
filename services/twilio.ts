// services/twilio.ts
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export class TwilioService {
  private config: TwilioConfig;

  constructor(config: TwilioConfig) {
    this.config = config;
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
      
      const body = new URLSearchParams({
        To: to,
        From: this.config.phoneNumber,
        Body: message,
      });

      const auth = btoa(`${this.config.accountSid}:${this.config.authToken}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('SMS sent successfully:', result.sid);
        return true;
      } else {
        const error = await response.json();
        console.error('Twilio error:', error);
        return false;
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      return false;
    }
  }

  async sendOTP(phone: string, otp: string): Promise<boolean> {
    const message = `Your LoyaltyApp verification code is: ${otp}. Valid for 5 minutes.`;
    return await this.sendSMS(phone, message);
  }
}

// Usage in Edge Functions or your app
export const twilioService = new TwilioService({
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
});
