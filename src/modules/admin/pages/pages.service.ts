import { Injectable } from '@nestjs/common';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}
  async createOrUpdate(slug: string, title: string, content: string) {
    try {
      const existing = await this.prisma.page.findUnique({ where: { slug } });
  
      if (existing) {
        const updatedPage = await this.prisma.page.update({
          where: { slug },
          data: { title, content },
        });

        return {
          success: true,
          message: 'Successfully created or updated page',
          data: updatedPage,
        }
      }

      // check title and content are there or not
      if (!title || !content) {
        return {
          success: false,
          message: 'Title and content are required',
        }
      }
    
      const page =  await this.prisma.page.create({
        data: { slug, title, content },
      });
    
      return {
        success: true,
        message: 'Successfully created or updated page',
        data: page,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create or update page',
      }
    }
  }

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
