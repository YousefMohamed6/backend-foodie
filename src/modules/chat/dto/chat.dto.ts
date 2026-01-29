import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({
    description: 'Array of participant user IDs',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  participantIds: string[];

  @ApiPropertyOptional({
    description: 'Channel name',
  })
  @IsString()
  @IsOptional()
  name?: string;
}

export class SendMessageDto {
  @ApiPropertyOptional({
    description: 'Message ID (optional, can be provided by client)',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Channel ID or Order ID to send message to',
  })
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiPropertyOptional({
    description: 'Text content of the message',
    maxLength: 5000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Message type: TEXT, IMAGE, or VIDEO',
    enum: ['TEXT', 'IMAGE', 'VIDEO'],
  })
  @IsString()
  @IsOptional()
  type?: 'TEXT' | 'IMAGE' | 'VIDEO';

  @ApiPropertyOptional({
    description: 'File path for media messages',
  })
  @IsString()
  @IsOptional()
  filePath?: string;

  @ApiPropertyOptional({
    description: 'Video thumbnail path',
  })
  @IsString()
  @IsOptional()
  videoThumbnail?: string;
}

export class SendMediaMessageDto {
  @ApiPropertyOptional({
    description: 'Message ID (optional, can be provided by client)',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Channel ID to send message to',
  })
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiPropertyOptional({
    description: 'Text message content',
    maxLength: 5000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @ApiProperty({
    description: 'Message type: TEXT, IMAGE, or VIDEO',
    enum: ['TEXT', 'IMAGE', 'VIDEO'],
    example: 'TEXT',
  })
  @IsString()
  @IsNotEmpty()
  type: 'TEXT' | 'IMAGE' | 'VIDEO';
}

export class CreateOrderChatDto {
  @ApiProperty({
    description: 'Order ID to create chat for',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Chat type: CUSTOMER_VENDOR, CUSTOMER_DRIVER, DRIVER_VENDOR, MANAGER_DRIVER, MANAGER_CUSTOMER or MANAGER_VENDOR',
    enum: ['CUSTOMER_VENDOR', 'CUSTOMER_DRIVER', 'DRIVER_VENDOR', 'MANAGER_DRIVER', 'MANAGER_CUSTOMER', 'MANAGER_VENDOR'],
  })
  @IsString()
  @IsNotEmpty()
  chatType: 'CUSTOMER_VENDOR' | 'CUSTOMER_DRIVER' | 'DRIVER_VENDOR' | 'MANAGER_DRIVER' | 'MANAGER_CUSTOMER' | 'MANAGER_VENDOR';
}

export class CreatePrivateChatDto {
  @ApiProperty({
    description: 'Manager ID to start chat with',
  })
  @IsString()
  @IsNotEmpty()
  managerId: string;
}
