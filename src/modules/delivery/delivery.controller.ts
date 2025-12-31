import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GeolocationService } from '../../shared/services/geolocation.service';

@ApiTags('Delivery')
@ApiBearerAuth()
@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly geolocationService: GeolocationService) {}

  @Get('charge')
  @ApiOperation({ summary: 'Calculate delivery charge' })
  @ApiQuery({ name: 'vendorId', required: true })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  async calculateCharge(
    @Query('vendorId') vendorId: string,
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
  ) {
    const charge = await this.geolocationService.calculateDeliveryCharge(
      vendorId,
      parseFloat(latitude),
      parseFloat(longitude),
    );
    return { charge };
  }
}

