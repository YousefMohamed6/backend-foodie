import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) { }

  async findAll(user: User) {
    if (user.role === UserRole.ADMIN) {
      return this.prisma.document.findMany();
    }
    if (user.role === UserRole.VENDOR) {
      return this.prisma.document.findMany({ where: { enable: true, type: 'vendor' } });
    }
    if (user.role === UserRole.DRIVER) {
      return this.prisma.document.findMany({ where: { enable: true, type: 'driver' } });
    }
    return this.prisma.document.findMany({ where: { enable: true } });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException('DOCUMENT_NOT_FOUND');
    }
    return document;
  }

  async create(data: CreateDocumentDto) {
    return this.prisma.document.create({ data });
  }

  async update(id: string, data: UpdateDocumentDto) {
    await this.findOne(id);
    return this.prisma.document.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.document.delete({ where: { id } });
  }
}
