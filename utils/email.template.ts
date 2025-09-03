// utils/email.template.ts
const emailTemplates = {
  registerVerificationEmail: (username: string, code: string) => {
    return {
      subject: 'Verify Your Email Address - Niche',
      mail: `
        <h3>Dear ${username},</h3>
        <p>Thank you for joining <strong>Niche</strong>! To complete your registration and activate your account, please use the verification code below:</p>
        
        <p style="font-size:16px; font-weight:bold; color:#333;">Verification Code: ${code}</p>
        
        <p>If you did not sign up for Niche, you can safely ignore this email.</p>
        
        <p>If you need help, contact us at <a href="mailto:xyz@gmail.com">xyz@gmail.com</a>.</p>
        
        <br>
        <p>Best regards,</p>
        <p><strong>The Niche Team</strong></p>
      `,
    };
  },

  greetEmail: (username: string) => {
    return {
      subject: 'Welcome to Niche!',
      mail: `
        <h3>Dear ${username},</h3>
        <p>We’re excited to welcome you to the <strong>Niche</strong> community!</p>
        
        <p>Your account has been successfully verified and you’re now ready to explore everything Niche has to offer. We’re here to support you along the way, so don’t hesitate to reach out with any questions.</p>
        
        <p>If you need assistance, you can always contact us at <a href="mailto:xyz@gmail.com">xyz@gmail.com</a>.</p>
        
        <br>
        <p>Welcome aboard,</p>
        <p><strong>The Niche Team</strong></p>
      `,
    };
  },

  loginGreetEmail: (username: string, loginTime?: string, loginLocation?: string) => {
    return {
      subject: 'Login Alert - Niche',
      mail: `
        <h3>Dear ${username},</h3>
        <p>We noticed a successful login to your <strong>Niche</strong> account.</p>
        
       ${loginTime && `<p><strong>Login Time:</strong> ${loginTime}</p>`}
        ${loginLocation ? `<p><strong>Location:</strong> ${loginLocation}</p>` : ''}
        
        <p>If this was you, no further action is required. If you did not log in, we strongly recommend resetting your password immediately and contacting our support team.</p>
        
        <p>For assistance, reach out to us at <a href="mailto:xyz@gmail.com">xyz@gmail.com</a>.</p>
        
        <br>
        <p>Stay secure,</p>
        <p><strong>The Niche Team</strong></p>
      `,
    };
  },

  otpRequestEmail: (username: string, code: string) => {
    return {
      subject: 'Your OTP Code - Niche',
      mail: `
        <h3>Dear ${username},</h3>
        <p>You requested a new one-time verification code for your <strong>Niche</strong> account. Please use the code below:</p>
        
        <p style="font-size:16px; font-weight:bold; color:#333;">Verification Code: ${code}</p>
        
        <p>If you did not request this code, please ignore this email.</p>
        
        <p>Need help? Contact us at <a href="mailto:xyz@gmail.com">xyz@gmail.com</a>.</p>
        
        <br>
        <p>Best regards,</p>
        <p><strong>The Niche Team</strong></p>
      `,
    };
  },
};

export { emailTemplates };
