import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';

@Processor('order-processing')
export class ProcessOrderProcessor {
  private readonly logger = new Logger(ProcessOrderProcessor.name);

  @Process()
  async handleOrderJob(job: any) {
    this.logger.log(
      `Received order-processing job ${job.id} with data: ${JSON.stringify(
        job.data,
      )}`,
    );
  }
}
