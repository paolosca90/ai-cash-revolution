import nodemailer from "nodemailer";
import { secret } from "encore.dev/config";

// Email configuration
const emailHost = secret("EmailHost");
const emailPort = secret("EmailPort");  
const emailUser = secret("EmailUser");
const emailPassword = secret("EmailPassword");
const fromEmail = secret("FromEmail");

// Create transporter
const transporter = nodemailer.createTransporter({
  host: emailHost(),
  port: parseInt(emailPort()),
  secure: true, // true for 465, false for other ports
  auth: {
    user: emailUser(),
    pass: emailPassword(),
  },
});

// Email templates
const EMAIL_TEMPLATES = {
  subscription_created: {
    subject: "Welcome to AI Trading Pro!",
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to AI Trading Pro!</h2>
        <p>Thank you for subscribing to our service. Your subscription is now active!</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Subscription Details:</h3>
          <p><strong>Plan:</strong> ${data.subscription.plan}</p>
          <p><strong>Status:</strong> ${data.subscription.status}</p>
          <p><strong>Current Period:</strong> ${new Date(data.subscription.current_period_start * 1000).toLocaleDateString()} - ${new Date(data.subscription.current_period_end * 1000).toLocaleDateString()}</p>
        </div>
        <p>You can manage your subscription and billing information in your <a href="${process.env.FRONTEND_URL}/billing">account dashboard</a>.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The AI Trading Pro Team</p>
      </div>
    `,
  },
  
  subscription_cancelled: {
    subject: "Subscription Cancellation Confirmed",
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Subscription Cancellation</h2>
        <p>We've received your request to cancel your subscription. Your subscription will remain active until the end of your current billing period.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3>Cancellation Details:</h3>
          <p><strong>Current Plan:</strong> ${data.subscription.plan}</p>
          <p><strong>Access Until:</strong> ${new Date(data.subscription.current_period_end * 1000).toLocaleDateString()}</p>
        </div>
        <p>You can reactivate your subscription at any time before it expires by visiting your <a href="${process.env.FRONTEND_URL}/billing">account dashboard</a>.</p>
        <p>We're sorry to see you go. If you have any feedback, please let us know how we can improve.</p>
        <p>Best regards,<br>The AI Trading Pro Team</p>
      </div>
    `,
  },
  
  subscription_ended: {
    subject: "Your subscription has ended",
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Subscription Ended</h2>
        <p>Your subscription has ended and your account has been downgraded to the free plan.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>What happens now?</h3>
          <ul>
            <li>You still have access to basic trading signals</li>
            <li>Advanced features are no longer available</li>
            <li>Your trading history and data are preserved</li>
          </ul>
        </div>
        <p>Ready to continue? You can <a href="${process.env.FRONTEND_URL}/billing">resubscribe at any time</a> to regain access to all premium features.</p>
        <p>Thank you for being a valued customer!</p>
        <p>Best regards,<br>The AI Trading Pro Team</p>
      </div>
    `,
  },
  
  payment_succeeded: {
    subject: "Payment Successful - Thank You!",
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payment Successful</h2>
        <p>Thank you! Your payment has been processed successfully.</p>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3>Payment Details:</h3>
          <p><strong>Amount:</strong> ${(data.invoice.amount_paid / 100).toFixed(2)} ${data.invoice.currency.toUpperCase()}</p>
          <p><strong>Invoice:</strong> ${data.invoice.number}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>You can view your full billing history and download invoices in your <a href="${process.env.FRONTEND_URL}/billing">account dashboard</a>.</p>
        <p>Thank you for your continued support!</p>
        <p>Best regards,<br>The AI Trading Pro Team</p>
      </div>
    `,
  },
  
  payment_failed: {
    subject: "Payment Failed - Action Required",
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Payment Failed</h2>
        <p>We were unable to process your payment. Your subscription is still active, but action is required to avoid service interruption.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3>What you need to do:</h3>
          <ol>
            <li>Check that your payment method is valid and has sufficient funds</li>
            <li>Update your payment method if necessary</li>
            <li>Contact your bank if you suspect the payment was blocked</li>
          </ol>
        </div>
        <p><a href="${process.env.FRONTEND_URL}/billing" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Payment Method</a></p>
        <p>If you need help, please contact our support team.</p>
        <p>Best regards,<br>The AI Trading Pro Team</p>
      </div>
    `,
  },
  
  trial_ending: {
    subject: "Your trial is ending soon",
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Your trial is ending soon</h2>
        <p>Your free trial will end in 3 days. Don't lose access to all the amazing features you've been enjoying!</p>
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3>Trial ends on:</h3>
          <p style="font-size: 18px; font-weight: bold;">${new Date(data.subscription.trial_end * 1000).toLocaleDateString()}</p>
        </div>
        <p>Continue enjoying premium features by subscribing now:</p>
        <p><a href="${process.env.FRONTEND_URL}/billing" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Choose Your Plan</a></p>
        <p>Questions? We're here to help!</p>
        <p>Best regards,<br>The AI Trading Pro Team</p>
      </div>
    `,
  },
};

// Email interface
export interface EmailOptions {
  to: string;
  template: keyof typeof EMAIL_TEMPLATES;
  data?: any;
}

// Send email function
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const template = EMAIL_TEMPLATES[options.template];
    if (!template) {
      console.error(`Email template '${options.template}' not found`);
      return false;
    }

    const mailOptions = {
      from: fromEmail(),
      to: options.to,
      subject: template.subject,
      html: template.html(options.data || {}),
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}:`, result.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Bulk email function for marketing campaigns
export async function sendBulkEmail(emails: EmailOptions[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      const success = await sendEmail(email);
      if (success) {
        sent++;
      } else {
        failed++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Error sending bulk email:", error);
      failed++;
    }
  }

  return { sent, failed };
}

// Send subscription expiration reminders
export async function sendExpirationReminders(): Promise<void> {
  try {
    // Find subscriptions expiring in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // This would be implemented with your actual database query
    console.log("Checking for subscriptions expiring on:", threeDaysFromNow.toISOString());
    
    // Implementation would include database query and email sending
    // This is a placeholder for the actual implementation
  } catch (error) {
    console.error("Error sending expiration reminders:", error);
  }
}