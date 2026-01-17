import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MarsoulResponseDto } from './dto/marsoul-response.dto';

@Injectable()
export class MarsoulService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<MarsoulResponseDto[]> {
    const managers = await this.prisma.user.findMany({
      where: {
        role: UserRole.MANAGER,
        isActive: true,
        zoneId: { not: null }, // Only managers with a zone
      },
      select: {
        firstName: true,
        lastName: true,
        phoneNumber: true,
        zoneId: true,
        zone: {
          select: {
            arabicName: true,
          },
        },
      },
    });

    return managers.map((manager: any) => ({
      managerName: `${manager.firstName} ${manager.lastName}`.trim(),
      phone: manager.phoneNumber || '',
      zoneId: manager.zoneId!,
      zoneName: manager.zone?.arabicName || '',
    }));
  }
}
