import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as ntpClient from 'ntp-client';

@Injectable()
export class TimeService implements OnModuleInit {
    private readonly logger = new Logger(TimeService.name);
    private offset = 0; // Offset in milliseconds
    private readonly ntpServer = 'pool.ntp.org';
    private readonly ntpPort = 123;

    async onModuleInit() {
        await this.syncTime();
        // Re-sync every 30 minutes
        setInterval(() => this.syncTime(), 30 * 60 * 1000);
    }

    private async syncTime(): Promise<void> {
        return new Promise((resolve) => {
            ntpClient.getNetworkTime(this.ntpServer, this.ntpPort, (err, date) => {
                if (err) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    this.logger.error(`Failed to sync with NTP server: ${errorMessage}. Using local time.`);
                    resolve();
                    return;
                }

                if (!date) {
                    this.logger.error('NTP server returned no date. Using local time.');
                    resolve();
                    return;
                }

                const networkTime = date.getTime();
                const localTime = Date.now();
                this.offset = networkTime - localTime;

                this.logger.log(`Time synced with NTP. Offset: ${this.offset}ms. Current Network Time: ${new Date(networkTime).toISOString()}`);
                resolve();
            });
        });
    }

    /**
     * Returns the current date adjusted by the NTP offset.
     */
    now(): Date {
        return new Date(Date.now() + this.offset);
    }

    /**
     * Returns the current timestamp in milliseconds adjusted by the NTP offset.
     */
    timestamp(): number {
        return Date.now() + this.offset;
    }

    /**
     * Returns the current offset in milliseconds.
     */
    getOffset(): number {
        return this.offset;
    }
}
