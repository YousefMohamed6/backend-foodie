import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async create(createAddressDto: CreateAddressDto, user: User) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) {
      // In a real app, this should be handled at user signup
      throw new ForbiddenException('MISSING_CUSTOMER_PROFILE');
    }

    if (createAddressDto.isDefault) {
      const address = await this.prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { customerId: profile.id, isDefault: true },
          data: { isDefault: false },
        });

        return tx.address.create({
          data: {
            ...createAddressDto,
            customerId: profile.id,
          },
        });
      });
      return this.transformAddress(address);
    }

    const address = await this.prisma.address.create({
      data: {
        ...createAddressDto,
        customerId: profile.id,
      },
    });
    return this.transformAddress(address);
  }

  async findAll(user: User) {
    const addresses = await this.prisma.address.findMany({
      where: { customer: { userId: user.id } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return addresses.map((addr) => this.transformAddress(addr));
  }

  async findDefault(user: User) {
    const address = await this.prisma.address.findFirst({
      where: { customer: { userId: user.id }, isDefault: true },
    });
    if (!address) {
      throw new NotFoundException('DEFAULT_ADDRESS_NOT_FOUND');
    }
    return this.transformAddress(address);
  }

  async findOne(id: string, user: User) {
    const address = await this.prisma.address.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!address) {
      throw new NotFoundException('ADDRESS_NOT_FOUND');
    }
    if (address.customer.userId !== user.id) {
      throw new ForbiddenException('ACCESS_DENIED');
    }
    return this.transformAddress(address);
  }

  async update(id: string, updateAddressDto: UpdateAddressDto, user: User) {
    // Ensure existence and ownership
    await this.findOne(id, user);

    if (updateAddressDto.isDefault) {
      const address = await this.prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { customer: { userId: user.id }, isDefault: true },
          data: { isDefault: false },
        });

        return tx.address.update({
          where: { id },
          data: updateAddressDto,
        });
      });
      return this.transformAddress(address);
    }

    const address = await this.prisma.address.update({
      where: { id },
      data: updateAddressDto,
    });
    return this.transformAddress(address);
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user);
    const address = await this.prisma.address.delete({ where: { id } });
    return this.transformAddress(address);
  }

  private transformAddress(address: any) {
    return {
      ...address,
      latitude: address.latitude ? Number(address.latitude) : null,
      longitude: address.longitude ? Number(address.longitude) : null,
    };
  }
}
