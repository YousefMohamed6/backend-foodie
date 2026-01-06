import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class ProcessPaymentDto {
    @ApiProperty({ description: 'Payment amount', example: 100.00 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ description: 'Payment method' })
    @IsNotEmpty()
    @IsString()
    paymentMethod: string;

    @ApiProperty({ description: 'Payment gateway', enum: ['stripe', 'paypal', 'razorpay', 'fawaterak'] })
    @IsNotEmpty()
    @IsEnum(['stripe', 'paypal', 'razorpay', 'fawaterak'])
    paymentGateway: string;

    @ApiPropertyOptional({ description: 'Order ID' })
    @IsOptional()
    @IsUUID()
    orderId?: string;
}
