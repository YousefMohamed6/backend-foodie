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
  @ApiProperty({
    description: 'Channel ID to send message to',
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
}

export class SendMediaMessageDto {
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
    description: 'Chat type: CUSTOMER_VENDOR or CUSTOMER_DRIVER',
    enum: ['CUSTOMER_VENDOR', 'CUSTOMER_DRIVER'],
  })
  @IsString()
  @IsNotEmpty()
  chatType: 'CUSTOMER_VENDOR' | 'CUSTOMER_DRIVER';
}
