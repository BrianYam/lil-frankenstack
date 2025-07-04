import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { ReactElement } from 'react';
import { Resend } from 'resend';
import { ForgotPasswordEmail } from './templates/forgot-password-email';
import { VerificationEmail } from './templates/verification-email';
import emailConfig from '@/configs/email.config';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger: CustomLoggerService;
  private readonly fromEmail: string;

  constructor(
    @Inject(emailConfig.KEY)
    private readonly emailConfiguration: ConfigType<typeof emailConfig>,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(EmailService.name);
    // Initialize Resend client with API key
    const resendApiKey = this.emailConfiguration.resendApiKey;
    this.resend = new Resend(resendApiKey);
    this.fromEmail = this.emailConfiguration.noReplyEmailDomain;
  }

  /**
   * Generic method to send an email using Resend
   * @param params Email parameters
   * @returns Object indicating success or failure
   */
  async sendEmail({
    to,
    subject,
    react,
    from = this.fromEmail,
    attachments = [],
  }: {
    to: string | string[];
    subject: string;
    react?: ReactElement;
    from?: string;
    attachments?: Array<{ filename: string; content: Buffer }>;
  }): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      if (!react) {
        this.logger.error('Either React component content must be provided');
        return {
          success: false,
          error: new Error(
            'Either React component or HTML content must be provided',
          ),
        };
      }

      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        react,
        attachments,
      });

      if (error) {
        this.logger.error(
          `Failed to send email to ${Array.isArray(to) ? to.join(', ') : to}. 
          Subject: "${subject}". Error: ${error.message}`,
        );
        return { success: false, error };
      }

      this.logger.log(
        `Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}. ID: ${data?.id}`,
      );
      return { success: true, data };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error sending email to ${Array.isArray(to) ? to.join(', ') : to}. 
        Subject: "${subject}". Error: ${errorMessage}`,
      );
      return { success: false, error };
    }
  }

  /**
   * Send a forgot password email with reset token and link
   * @param to Recipient email
   * @param resetToken Reset token
   * @param resetLink Reset link URL
   * @returns Boolean indicating success or failure
   */
  async sendForgotPasswordEmail(
    to: string,
    resetToken: string,
    resetLink: string,
  ): Promise<boolean> {
    const result = await this.sendEmail({
      to,
      subject: 'Reset Your Password',
      react: ForgotPasswordEmail({
        userEmail: to,
        resetToken,
        resetLink,
      }),
    });

    return result.success;
  }

  /**
   * Send a verification email with a verification link
   * @param to Recipient email
   * @param verificationToken Verification token
   * @param verificationLink Verification link URL
   * @returns Boolean indicating success or failure
   */
  async sendVerificationEmail(
    to: string,
    verificationToken: string,
    verificationLink: string,
  ): Promise<boolean> {
    const result = await this.sendEmail({
      to,
      subject: 'Verify Your Email Address',
      react: VerificationEmail({
        userEmail: to,
        verificationToken,
        verificationLink,
      }),
    });

    return result.success;
  }
}
