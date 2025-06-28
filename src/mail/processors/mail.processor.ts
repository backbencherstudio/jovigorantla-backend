// import { MailerService } from '@nestjs-modules/mailer';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ResendService } from 'nestjs-resend';

import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';
import { MailerService } from '@nestjs-modules/mailer';

// async function renderEmailTemplate(templateName: string, data: any): Promise<string> {
//   const filePath = path.join(__dirname, '..', 'templates', `${templateName}.ejs`);
//   const template = fs.readFileSync(filePath, 'utf8');
//   return ejs.render(template, data);
// }

async function renderEmailTemplate(templateName: string, data: any): Promise<string> {
  try {
    const filePath = path.join(__dirname, '..', 'templates', `${templateName}.ejs`);
    const template = fs.readFileSync(filePath, 'utf8');
    return await ejs.render(template, data);
  } catch (error) {
    console.error(`Error rendering template ${templateName}:`, error);
    throw new Error(`Failed to render email template: ${error.message}`);
  }
}


@Processor('bbs-queue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  // private mailerService: MailerService
  constructor(private readonly resendService: ResendService, private readonly mailerService: MailerService) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} with name ${job.name} completed`);
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} with name ${job.name}`);
    try {
      switch (job.name) {
        case 'sendMemberInvitation':
          this.logger.log('Sending member invitation email');
          await this.mailerService.sendMail({
            to: job.data.to,
            from: job.data.from,
            subject: job.data.subject,
            template: job.data.template,
            context: job.data.context,
          });

          // const htmlContentSM: any = renderEmailTemplate(job.data.template, job.data.context);

          // await this.resendService.send({
          //   from: job.data.from,
          //   to: job.data.to,
          //   subject: job.data.subject,
          //   html: htmlContentSM,
          // })
          break;
        case 'sendOtpCodeToEmail':
          this.logger.log('Sending OTP code to email');
          // await this.mailerService.sendMail({
          //   to: job.data.to, 
          //   from: job.data.from,
          //   subject: job.data.subject,
          //   template: job.data.template,
          //   context: job.data.context,
          // });

           
          const htmlContent = await renderEmailTemplate(job.data.template, job.data.context);

          // Validate rendered content
          if (typeof htmlContent !== 'string') {
            console.error('Invalid rendered template content')
            throw new Error('Rendered template is not a string');
          }


          const res = await this.resendService.send({
            from: 'support@desieasy.com',
            to: job.data.to,
            subject: `${job.data.context.otp} is your Desieasy verification code`,
            html: htmlContent
          })

          console.log(res, 'RES')
          // console.log(htmlContent, 'HTML')
          // console.log(job.data, job.data.context)
          break;

        default:
          this.logger.log('Unknown job name');
          return;
      }
    } catch (error) {
      this.logger.error(
        `Error processing job ${job.id} with name ${job.name}`,
        error,
      );
      throw error;
    }
  }
}
