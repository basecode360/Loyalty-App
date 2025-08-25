// services/sendgrid.ts
export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export class SendGridService {
  private config: SendGridConfig;

  constructor(config: SendGridConfig) {
    this.config = config;
  }

  async sendEmail(
    to: string,
    template: EmailTemplate,
    personalizations?: Record<string, string>
  ): Promise<boolean> {
    try {
      const url = 'https://api.sendgrid.com/v3/mail/send';
      
      // Replace template variables
      let htmlContent = template.htmlContent;
      let textContent = template.textContent || template.subject;
      
      if (personalizations) {
        Object.entries(personalizations).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
          textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
        });
      }

      const payload = {
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName,
        },
        subject: template.subject,
        content: [
          {
            type: 'text/plain',
            value: textContent,
          },
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 202) {
        console.log('Email sent successfully');
        return true;
      } else {
        const error = await response.text();
        console.error('SendGrid error:', error);
        return false;
      }
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string, userName?: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: 'Your LoyaltyApp Verification Code',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verification Code</h2>
          <p>Hi ${userName || 'there'},</p>
          <p>Your verification code for LoyaltyApp is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">LoyaltyApp Team</p>
        </div>
      `,
      textContent: `Your LoyaltyApp verification code is: ${otp}. Valid for 5 minutes.`
    };

    return await this.sendEmail(email, template, {
      otp,
      userName: userName || 'User'
    });
  }

  async sendReceiptApprovalEmail(email: string, receiptDetails: any): Promise<boolean> {
    const template: EmailTemplate = {
      subject: 'Receipt Approved - Points Awarded!',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Receipt Approved!</h2>
          <p>Great news! Your receipt has been approved and points have been added to your account.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Receipt Details:</h3>
            <p><strong>Store:</strong> ${receiptDetails.retailer}</p>
            <p><strong>Amount:</strong> $${receiptDetails.total}</p>
            <p><strong>Points Earned:</strong> ${receiptDetails.points}</p>
          </div>
          <p>Keep scanning receipts to earn more points!</p>
        </div>
      `
    };

    return await this.sendEmail(email, template);
  }
}

// Usage
export const sendGridService = new SendGridService({
  apiKey: process.env.SENDGRID_API_KEY || '',
  fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@loyaltyapp.com',
  fromName: 'LoyaltyApp'
});
