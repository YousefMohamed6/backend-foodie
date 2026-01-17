import { Injectable } from '@nestjs/common';
import { CommissionService } from '../commission.service';

@Injectable()
export class OrderCommissionReportsService {
    constructor(private commissionService: CommissionService) { }

    async getCommissionReport(startDate?: Date, endDate?: Date) {
        return this.commissionService.getPlatformCommissionTotal(
            startDate,
            endDate,
        );
    }

    async getVendorCommissionReport(
        vendorId: string,
        startDate?: Date,
        endDate?: Date,
    ) {
        return this.commissionService.getVendorNetReceivables(
            vendorId,
            startDate,
            endDate,
        );
    }

    async getDriverCommissionReport(
        driverId: string,
        startDate?: Date,
        endDate?: Date,
    ) {
        return this.commissionService.getDriverEarnings(
            driverId,
            startDate,
            endDate,
        );
    }

    async getMonthlyCommissionReport(year: number, month: number) {
        return this.commissionService.getMonthlyCommissionReport(year, month);
    }

    async getOrderCommissionSnapshots(orderId: string) {
        return this.commissionService.getOrderCommissionSnapshots(orderId);
    }
}
