import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ComplaintDto } from './dto/complaint.dto';
import { ContactDto } from './dto/contact.dto';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  @Post('contact')
  @ApiOperation({ summary: 'Send contact message' })
  contact(@Body() data: ContactDto) {
    // Mock sending contact message
    return { message: 'Message sent successfully' };
  }

  @Post('complaints')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send a complaint' })
  complaint(@Body() data: ComplaintDto, @Request() req) {
    // Mock sending complaint
    return {
      message: 'Complaint submitted successfully',
      id: Math.random().toString(36).substring(7),
    };
  }
}
