import { Injectable } from '@nestjs/common';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async getAllPages() {
    try {
      const pages = await this.prisma.page.findMany();
      return {
        success: true,
        message: 'Successfully retrieved all pages',
        data: pages,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get all pages',
      }
    }
  }
  
  async getPage(slug: string) {
    try {
      const page = await this.prisma.page.findUnique({ where: { slug } });
      return {
        success: true,
        message: 'Successfully retrieved page',
        data: page,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get page',
      }
    }
  }
}
