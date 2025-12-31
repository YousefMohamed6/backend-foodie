import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FavouritesService } from './favourites.service';

@ApiTags('Favourites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favourites')
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Get('restaurants')
  @ApiOperation({ summary: 'Get favorite vendors' })
  getFavoriteVendors(@Request() req) {
    return this.favouritesService.getFavoriteVendors(req.user.id);
  }

  @Post('restaurants')
  @ApiOperation({ summary: 'Add vendor to favorites' })
  addFavoriteVendor(@Body('vendorId') vendorId: string, @Request() req) {
    return this.favouritesService.addFavoriteVendor(req.user.id, vendorId);
  }

  @Delete('restaurants/:vendorId')
  @ApiOperation({ summary: 'Remove vendor from favorites' })
  removeFavoriteVendor(@Param('vendorId') vendorId: string, @Request() req) {
    return this.favouritesService.removeFavoriteVendor(req.user.id, vendorId);
  }

  @Get('items')
  @ApiOperation({ summary: 'Get favorite products' })
  getFavoriteProducts(@Request() req) {
    return this.favouritesService.getFavoriteProducts(req.user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add product to favorites' })
  addFavoriteProduct(@Body('productId') productId: string, @Request() req) {
    return this.favouritesService.addFavoriteProduct(req.user.id, productId);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove product from favorites' })
  removeFavoriteProduct(@Param('productId') productId: string, @Request() req) {
    return this.favouritesService.removeFavoriteProduct(req.user.id, productId);
  }
}
