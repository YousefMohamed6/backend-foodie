import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { User } from '@prisma/client';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@ApiBearerAuth()
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  create(
    @Body() createAddressDto: CreateAddressDto,
    @CurrentUser() user: User,
  ) {
    return this.addressesService.create(createAddressDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all addresses for current user' })
  findAll(@CurrentUser() user: User) {
    return this.addressesService.findAll(user);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default address for current user' })
  findDefault(@CurrentUser() user: User) {
    return this.addressesService.findDefault(user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @CurrentUser() user: User,
  ) {
    return this.addressesService.update(id, updateAddressDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.addressesService.remove(id, user);
  }
}
