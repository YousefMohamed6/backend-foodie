import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateChannelDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  participantIds: string[];

  @ApiProperty({ required: false })
  @IsString()
  name?: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;
}
