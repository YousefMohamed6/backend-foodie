import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    const emailConfig = this.configService.get('email');
    
    if (emailConfig?.smtpUser && emailConfig?.smtpPassword) {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort,
        secure: emailConfig.smtpSecure,
        auth: {
          user: emailConfig.smtpUser,
          pass: emailConfig.smtpPassword,
        },
      });
    } else {
      this.logger.warn('Email service not configured. Emails will be logged to console.');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    const emailConfig = this.configService.get('email');
    
    if (!this.transporter) {
      this.logger.log(`[Email] To: ${to}, Subject: ${subject}`);
      this.logger.log(`[Email] Body: ${text || html}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: emailConfig.smtpFrom,
        to,
        subject,
        html,
        text,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    const appUrl = this.configService.get('app.url') || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await this.sendEmail(email, 'Password Reset Request', html);
  }

  async sendWalletTopupEmail(
    email: string,
    amount: number,
    transactionId: string,
  ): Promise<void> {
    const html = `
      <h2>Wallet Top-up Confirmation</h2>
      <p>Your wallet has been topped up successfully.</p>
      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
      <p><strong>Transaction ID:</strong> ${transactionId}</p>
      <p>Thank you for using our service!</p>
    `;

    await this.sendEmail(email, 'Wallet Top-up Confirmation', html);
  }

  async sendOrderConfirmation(
    email: string,
    orderId: string,
    orderDetails: any,
  ): Promise<void> {
    const html = `
      <h2>Order Confirmation</h2>
      <p>Your order has been placed successfully!</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Total Amount:</strong> $${orderDetails.totalAmount}</p>
      <p>Thank you for your order!</p>
    `;

    await this.sendEmail(email, 'Order Confirmation', html);
  }
}

