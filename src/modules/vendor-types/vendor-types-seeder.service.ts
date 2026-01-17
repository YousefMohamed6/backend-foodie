import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VendorTypesSeederService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        await this.seed();
    }

    async seed() {
        const count = await this.prisma.vendorType.count();
        if (count > 0) return;

        const vendorTypes = [
            { englishName: 'Restaurant', arabicName: 'مطعم' },
            { englishName: 'Cafe', arabicName: 'كافيه' },
            { englishName: 'Bar', arabicName: 'بار' },
            { englishName: 'Fast Food', arabicName: 'وجبات سريعة' },
        ];

        await this.prisma.vendorType.createMany({ data: vendorTypes });
        console.log('VendorTypes seeded');
    }
}
