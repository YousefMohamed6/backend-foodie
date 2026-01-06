import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Audit Logging Service
 * 
 * Tracks critical operations for security and compliance.
 * Inspired by enterprise audit logging (Google Cloud Audit Logs, AWS CloudTrail).
 * 
 * Logs:
 * - Payment transactions
 * - Wallet operations
 * - Admin actions
 * - Authentication events
 * - Data exports
 * - Configuration changes
 */
@Injectable()
export class AuditLogService {
    private readonly logger = new Logger('AuditLog');

    constructor(private prisma: PrismaService) { }

    /**
     * Log payment operation
     */
    async logPayment(data: {
        userId: string;
        action: 'PROCESS' | 'REFUND' | 'FAILED';
        amount: number;
        currency: string;
        gateway: string;
        metadata?: any;
    }): Promise<void> {
        this.logger.log(
            `PAYMENT [${data.action}] User:${data.userId} Amount:${data.amount}${data.currency} Gateway:${data.gateway}`,
        );

        // Optionally store in database for compliance
        // await this.prisma.auditLog.create({ data: { ... } });
    }

    /**
     * Log wallet operation
     */
    async logWallet(data: {
        userId: string;
        action: 'TOPUP' | 'WITHDRAW' | 'TRANSFER';
        amount: number;
        balanceBefore: number;
        balanceAfter: number;
        metadata?: any;
    }): Promise<void> {
        this.logger.log(
            `WALLET [${data.action}] User:${data.userId} Amount:${data.amount} Balance:${data.balanceBefore}->${data.balanceAfter}`,
        );
    }

    /**
     * Log admin action
     */
    async logAdminAction(data: {
        adminId: string;
        action: string;
        resource: string;
        resourceId?: string;
        changes?: any;
        ipAddress?: string;
    }): Promise<void> {
        this.logger.warn(
            `ADMIN [${data.action}] Admin:${data.adminId} Resource:${data.resource}:${data.resourceId || 'N/A'} IP:${data.ipAddress || 'unknown'}`,
        );
    }

    /**
     * Log authentication event
     */
    async logAuth(data: {
        userId?: string;
        action: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'FAILED_LOGIN' | 'PASSWORD_RESET';
        email?: string;
        ipAddress?: string;
        userAgent?: string;
        success: boolean;
    }): Promise<void> {
        const status = data.success ? 'SUCCESS' : 'FAILED';
        this.logger.log(
            `AUTH [${data.action}] ${status} User:${data.userId || data.email || 'unknown'} IP:${data.ipAddress || 'unknown'}`,
        );
    }

    /**
     * Log data export (GDPR compliance)
     */
    async logDataExport(data: {
        userId: string;
        requestedBy: string;
        dataType: string;
        ipAddress?: string;
    }): Promise<void> {
        this.logger.warn(
            `DATA_EXPORT User:${data.userId} Type:${data.dataType} RequestedBy:${data.requestedBy} IP:${data.ipAddress || 'unknown'}`,
        );
    }

    /**
     * Log security event
     */
    async logSecurityEvent(data: {
        event: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        userId?: string;
        details: string;
        ipAddress?: string;
    }): Promise<void> {
        this.logger.error(
            `SECURITY [${data.severity}] ${data.event} User:${data.userId || 'unknown'} Details:${data.details} IP:${data.ipAddress || 'unknown'}`,
        );
    }
}
