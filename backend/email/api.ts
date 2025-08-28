import { api } from "encore.dev/api";

// Production-ready email service
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Initialize SendGrid when API key is provided
let sgMail: any = null;
if (SENDGRID_API_KEY) {
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('✅ SendGrid initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize SendGrid:', error);
  }
}
export interface SendEmailRequest {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SendWelcomeEmailRequest {
  userEmail: string;
  userName: string;
  installerDownloadUrl: string;
  plan: string;
}

export const sendEmail = api<SendEmailRequest, SendEmailResponse>({
  method: "POST",
  path: "/email/send",
  expose: true,
}, async (request) => {
  console.log(`📧 Email send request - ${IS_PRODUCTION ? 'PRODUCTION' : 'TEST'} mode`);
  console.log(`To: ${request.to} (${request.toName || 'No name'})`);
  console.log(`Subject: ${request.subject}`);
  
  if (IS_PRODUCTION && sgMail) {
    try {
      const msg = {
        to: {
          email: request.to,
          name: request.toName || request.to
        },
        from: {
          email: process.env.FROM_EMAIL || 'noreply@aicashrevolution.com',
          name: 'AI Cash R-evolution'
        },
        subject: request.subject,
        html: request.htmlContent,
        text: request.textContent || request.htmlContent.replace(/<[^>]*>/g, '')
      };
      
      const response = await sgMail.send(msg);
      const messageId = response[0].headers['x-message-id'] || `sg_${Date.now()}`;
      
      console.log(`✅ Email sent successfully: ${messageId}`);
      
      return {
        success: true,
        messageId: messageId
      };
      
    } catch (error: any) {
      console.error("SendGrid error:", error);
      return {
        success: false,
        error: "Failed to send email"
      };
    }
  } else {
    // Development mode - just log
    console.log(`Content length: ${request.htmlContent.length} chars`);
    
    return {
      success: true,
      messageId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
});

export const sendWelcomeEmail = api<SendWelcomeEmailRequest, SendEmailResponse>({
  method: "POST",
  path: "/email/welcome",
  expose: true,
}, async ({ userEmail, userName, installerDownloadUrl, plan }) => {
  console.log(`📧 Welcome email for ${userName} (${userEmail}) - ${IS_PRODUCTION ? 'PRODUCTION' : 'TEST'} mode`);
  console.log(`Plan: ${plan}, Installer URL: ${installerDownloadUrl}`);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to AI Cash R-evolution</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">Welcome to AI Cash R-evolution, ${userName}!</h1>
      <p>Thank you for subscribing to our <strong>${plan}</strong> plan.</p>
      <p>Your personalized trading installer is ready for download:</p>
      <p style="margin: 20px 0;">
        <a href="${installerDownloadUrl}" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Download Your Installer
        </a>
      </p>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>AI Cash R-evolution Team</p>
    </body>
    </html>
  `;
  
  if (IS_PRODUCTION && SENDGRID_API_KEY) {
    // Use the main sendEmail function for consistency
    return await sendEmail({
      to: userEmail,
      toName: userName,
      subject: `Welcome to AI Cash R-evolution - ${plan} Plan Activated`,
      htmlContent: htmlContent,
      textContent: `Welcome to AI Cash R-evolution, ${userName}! Your ${plan} plan is now active. Download your installer: ${installerDownloadUrl}`
    });
  } else {
    // Development mode - just log
    return {
      success: true,
      messageId: `welcome_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
});