import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sesClient: SESClient | null = null;
  private mailFrom: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION');
    const sessionToken = this.configService.get<string>('AWS_SESSION_TOKEN'); 
    this.mailFrom = this.configService.get<string>('AWS_SES_MAIL_FROM') ?? '';

    if (accessKeyId && secretAccessKey && region && this.mailFrom) {
      this.sesClient = new SESClient({
        region: region,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
          ...(sessionToken && { sessionToken }), 
        },
      });
      this.logger.log('SES Client initialized.');
    } else {
      this.logger.warn('SES credentials or mail_from not found in .env. Email sending will be skipped.');
    }
  }

  async sendEmail(to: string | string[], subject: string, htmlBody: string, textBody?: string) {
    if (!this.sesClient) {
      this.logger.warn(`Skipping email to "${to}" with subject "${subject}" due to missing SES configuration.`);
      return;
    }

    if (!this.mailFrom) {
        this.logger.error('AWS_SES_MAIL_FROM is not configured. Cannot send email.');
        return;
    }

    const params: SendEmailCommandInput = {
      Source: this.mailFrom,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: htmlBody,
          },
          ...(textBody && {
            Text: {
              Charset: 'UTF-8',
              Data: textBody,
            },
          }),
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      const data = await this.sesClient.send(command);
      this.logger.log(`Email sent successfully to ${to}. Message ID: ${data.MessageId}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }

  generateVerificationEmailHtml(name: string, verificationLink: string): string {
    return `
      <h1>Hello ${name},</h1>
      <p>Thank you for registering. Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>If you did not request this, please ignore this email.</p>
    `;
  }


  generateGenericNotificationHtml(subject: string, message: string): string {
      return `
        <h1>${subject}</h1>
        <p>${message}</p>
      `;
  }
}