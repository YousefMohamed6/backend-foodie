import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';
import { UpdateVendorTypeDto } from './dto/update-vendor-type.dto';

@Injectable()
export class VendorTypesService {
  constructor(private prisma: PrismaService) { }

  async create(createVendorTypeDto: CreateVendorTypeDto) {
    return this.prisma.vendorType.create({
      data: createVendorTypeDto,
    });
  }

  async findAll() {
    return this.prisma.vendorType.findMany({
      where: {
        isActive: true,
        showOnHome: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.vendorType.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vendorType = await this.prisma.vendorType.findUnique({
      where: { id },
    });

    if (!vendorType) {
      throw new NotFoundException('VENDOR_TYPE_NOT_FOUND');
    }

    return vendorType;
  }

  async update(id: string, updateVendorTypeDto: UpdateVendorTypeDto) {
    await this.findOne(id);

    return this.prisma.vendorType.update({
      where: { id },
      data: updateVendorTypeDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.vendorType.delete({
      where: { id },
    });
  }
}
