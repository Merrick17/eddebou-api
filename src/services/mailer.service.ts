import { Injectable } from '@nestjs/common';

interface MailOptions {
  to: string;
  subject: string;
  template: string;
  context: any;
}

@Injectable()
export class MailerService {
  async sendMail(options: MailOptions): Promise<void> {
    // TODO: Implement actual email sending logic
    console.log('Sending email:', options);
  }
} 