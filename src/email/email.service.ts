import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand, SendEmailCommandInput, SendRawEmailCommand } from '@aws-sdk/client-ses';

interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
  encoding?: 'base64' | 'quoted-printable' | '8bit';
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sesClient: SESClient | null = null;
  private mailFrom: string;
  private _isConfigured: boolean = false;

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
      this._isConfigured = true;
    } else {
      this.logger.warn('SES credentials or mail_from not found in .env. Email sending will be skipped.');
      this._isConfigured = false;
    }
  }

  isConfigured(): boolean {
      return this._isConfigured;
  }

  private _buildRawEmail(
    to: string | string[],
    subject: string,
    htmlBody: string,
    textBody?: string,
    attachments?: EmailAttachment[],
  ): string {
    const boundary = `----=_Part_${Math.random().toString().slice(2)}`;
    let rawEmail = '';

    rawEmail += `From: ${this.mailFrom}\r\n`;
    rawEmail += `To: ${Array.isArray(to) ? to.join(',') : to}\r\n`;
    rawEmail += `Subject: ${subject}\r\n`;
    rawEmail += `MIME-Version: 1.0\r\n`;

    if (attachments && attachments.length > 0) {
      rawEmail += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
      rawEmail += '\r\n';
      
      rawEmail += `--${boundary}\r\n`;
      rawEmail += `Content-Type: multipart/alternative; boundary="${boundary}_alt"\r\n`;
      rawEmail += '\r\n';

      if (textBody) {
        rawEmail += `--${boundary}_alt\r\n`;
        rawEmail += `Content-Type: text/plain; charset=UTF-8\r\n`;
        rawEmail += `Content-Transfer-Encoding: 8bit\r\n`;
        rawEmail += '\r\n';
        rawEmail += `${textBody}\r\n`;
      }

      rawEmail += `--${boundary}_alt\r\n`;
      rawEmail += `Content-Type: text/html; charset=UTF-8\r\n`;
      rawEmail += `Content-Transfer-Encoding: quoted-printable\r\n`;
      rawEmail += '\r\n';
      rawEmail += `${htmlBody}\r\n`;
      rawEmail += `--${boundary}_alt--\r\n`;
      rawEmail += '\r\n';

      for (const attachment of attachments) {
        rawEmail += `--${boundary}\r\n`;
        rawEmail += `Content-Type: ${attachment.contentType}; name="${attachment.filename}"\r\n`;
        rawEmail += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        
        const encoding = attachment.encoding || (attachment.contentType.includes('text/') ? '8bit' : 'base64');
        rawEmail += `Content-Transfer-Encoding: ${encoding}\r\n`;
        rawEmail += '\r\n';

        let content = attachment.content;
        if (typeof content !== 'string') {
            content = content.toString();
        }

        if (encoding === 'base64') {
          rawEmail += Buffer.from(content).toString('base64') + '\r\n';
        } else {
          rawEmail += content + '\r\n';
        }
      }
      rawEmail += `--${boundary}--\r\n`;
    } else {
      rawEmail += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
      rawEmail += '\r\n';

      if (textBody) {
        rawEmail += `--${boundary}\r\n`;
        rawEmail += `Content-Type: text/plain; charset=UTF-8\r\n`;
        rawEmail += `Content-Transfer-Encoding: 8bit\r\n`;
        rawEmail += '\r\n';
        rawEmail += `${textBody}\r\n`;
      }

      rawEmail += `--${boundary}\r\n`;
      rawEmail += `Content-Type: text/html; charset=UTF-8\r\n`;
      rawEmail += `Content-Transfer-Encoding: quoted-printable\r\n`;
      rawEmail += '\r\n';
      rawEmail += `${htmlBody}\r\n`;
      rawEmail += `--${boundary}--\r\n`;
    }

    return rawEmail;
  }

  async sendEmail(
    to: string | string[],
    subject: string,
    htmlBody: string,
    textBody?: string,
    attachments?: EmailAttachment[],
  ) {
    if (!this.sesClient || !this._isConfigured) {
      this.logger.warn(`Skipping email to "${to}" with subject "${subject}" due to missing SES configuration.`);
      return;
    }

    if (!this.mailFrom) {
        this.logger.error('AWS_SES_MAIL_FROM is not configured. Cannot send email.');
        return;
    }

    if (attachments && attachments.length > 0) {
      const rawMessage = this._buildRawEmail(to, subject, htmlBody, textBody, attachments);
      
      try {
        const command = new SendRawEmailCommand({
          RawMessage: {
            Data: Buffer.from(rawMessage, 'utf-8'),
          },
          Destinations: Array.isArray(to) ? to : [to],
          Source: this.mailFrom,
        });
        const data = await this.sesClient.send(command);
        this.logger.log(`Raw email sent successfully to ${to}. Message ID: ${data.MessageId}`);
        return data;
      } catch (error) {
        this.logger.error(`Failed to send raw email to ${to}: ${error.message}`, error.stack);
        throw error;
      }
    } else {
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