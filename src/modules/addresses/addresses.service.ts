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
  constructor(private prisma: PrismaService) { }

  async create(createAddressDto: CreateAddressDto, user: User) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) {
      // In a real app, this should be handled at user signup
      throw new ForbiddenException('User does not have a customer profile');
    }

    if (createAddressDto.isDefault) {
      return this.prisma.$transaction(async (tx) => {
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
    }

    return this.prisma.address.create({
      data: {
        ...createAddressDto,
        customerId: profile.id,
      },
    });
  }

  async findAll(user: User) {
    return this.prisma.address.findMany({
      where: { customer: { userId: user.id } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findDefault(user: User) {
    const address = await this.prisma.address.findFirst({
      where: { customer: { userId: user.id }, isDefault: true },
    });
    if (!address) {
      throw new NotFoundException('Default address not found');
    }
    return address;
  }

  async findOne(id: string, user: User) {
    const address = await this.prisma.address.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }
    if (address.customer.userId !== user.id) {
      throw new ForbiddenException('Access to this address is denied');
    }
    return address;
  }

  async update(id: string, updateAddressDto: UpdateAddressDto, user: User) {
    // Ensure existence and ownership
    await this.findOne(id, user);

    if (updateAddressDto.isDefault) {
      return this.prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { customer: { userId: user.id }, isDefault: true },
          data: { isDefault: false },
        });

        return tx.address.update({
          where: { id },
          data: updateAddressDto,
        });
      });
    }

    return this.prisma.address.update({
      where: { id },
      data: updateAddressDto,
    });
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user);
    return this.prisma.address.delete({ where: { id } });
  }
}
