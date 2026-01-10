import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AdminReplyDto {
    @ApiPropertyOptional({
        description: 'Inbox ID to reply to',
    })
    @IsString()
    inboxId: string;
}
