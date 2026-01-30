import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MarsoulResponseDto } from './dto/marsoul-response.dto';
import { MarsoulService } from './marsoul.service';

@ApiTags('Marsoul')
@ApiBearerAuth()
@Controller('marsoul')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarsoulController {
  constructor(private readonly marsoulService: MarsoulService) { }

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all active managers with their zone information',
  })
  @ApiOkResponse({
    description: 'List of managers',
  })
  async findAll(): Promise<MarsoulResponseDto[]> {
    return this.marsoulService.findAll();
  }
}
