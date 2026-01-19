import { AdminModule } from '@adminjs/nestjs';
import { Database, Resource } from '@adminjs/prisma';
import { Module } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import AdminJS from 'adminjs';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';

// Register the Prisma adapter for AdminJS
AdminJS.registerAdapter({ Database, Resource });

@Module({
  imports: [
    PrismaModule,
    AdminModule.createAdminAsync({
      imports: [PrismaModule],
      inject: [PrismaService],
      useFactory: async (prisma: PrismaService) => {
        // Retrieve the DMMF (Data Model Meta Format) to get all model definitions automatically.
        // We access _dmmf from the Prisma Client instance (runtime) or fallback to Prisma.dmmf if available.
        // This ensures we get all models defined in schema.prisma without manual listing.
        const dmmf =
          (prisma as any)._dmmf?.datamodel || (Prisma as any).dmmf?.datamodel;

        if (!dmmf) {
          console.error(
            'AdminUI: Could not retrieve Prisma DMMF. Admin UI might not show resources.',
          );
          return {
            adminJsOptions: {
              rootPath: '/admin',
              resources: [],
            },
          };
        }

        // Fix for @adminjs/prisma compatibility with newer Prisma versions
        // The adapter expects client._baseDmmf.datamodelEnumMap to exist
        const datamodelEnumMap = {};
        if (dmmf.enums) {
          dmmf.enums.forEach((e: any) => {
            datamodelEnumMap[e.name] = e;
          });
        }

        if (!(prisma as any)._baseDmmf) {
          (prisma as any)._baseDmmf = {
            datamodelEnumMap,
          };
        }

        // Map all models to AdminJS resources
        const resources = dmmf.models.map((model) => ({
          resource: {
            model: model,
            client: prisma,
          },
          options: {
            // Customize resource options here if needed (e.g., navigation grouping)
            navigation: {
              name: 'Database',
              icon: 'Database',
            },
            actions: {
              bulkDelete: {
                actionType: 'bulk',
                method: 'post',
              },
            },
          },
        }));

        console.log(
          `AdminUI: Automatically loaded ${resources.length} resources.`,
        );

        return {
          adminJsOptions: {
            rootPath: '/api/v1/admin',
            resources,
            branding: {
              companyName: 'Foodie Admin',
              withMadeWithLove: false,
            },
          },
        };
      },
    }),
  ],
})
export class AdminUIModule { }
