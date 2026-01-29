import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MarsoulResponseDto } from './dto/marsoul-response.dto';

@Injectable()
export class MarsoulService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(): Promise<MarsoulResponseDto[]> {
    const managers = await this.prisma.user.findMany({
      where: {
        role: UserRole.MANAGER,
        isActive: true,
        zoneId: { not: null }, // Only managers with a zone
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        countryCode: true,
        profilePictureURL: true,
        zoneId: true,
        zone: {
          select: {
            arabicName: true,
          },
        },
      },
    });

    console.log(`MarsoulService.findAll: Found ${managers.length} managers`);

    return managers.map((manager: any) => {
      const countryCode = manager.countryCode || '';
      let phone = manager.phoneNumber || '';

      // If phone starts with '+', it might already have country code
      // We'll clean it up to ensure we returned the mixed version
      if (phone.startsWith('+')) {
        // If it starts with same country code, don't double it
        if (countryCode && phone.startsWith(countryCode)) {
          // Already has it
        } else if (!countryCode) {
          // No explicit country code, use as is
        } else {
          // New country code prepended to existing full number (might be weird, but following user request to MIX)
          phone = `${countryCode}${phone}`;
        }
      } else {
        phone = `${countryCode}${phone}`;
      }

      return {
        id: manager.id,
        managerName: `${manager.firstName} ${manager.lastName}`.trim(),
        profilePictureURL: manager.profilePictureURL,
        phone: phone,
        zoneId: manager.zoneId!,
        zoneName: manager.zone?.arabicName || '',
      };
    });
  }
}
