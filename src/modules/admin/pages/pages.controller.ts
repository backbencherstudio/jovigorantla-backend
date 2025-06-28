import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { PagesService } from './pages.service';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';

@Controller('admin/pages')
@Roles(Role.ADMIN, Role.CO_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // get all pages
  @Get()
  async findAll() {
    try {
      return await this.pagesService.getAllPages();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get pages',
      };
    }
  }

  @Post('about-us')
  async createOrUpdateAboutUs(@Body() body: { title: string; content: string }) {
    try {
      return await this.pagesService.createOrUpdate('about-us', body.title, body.content);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create or update page',
      };
    }
  }


  @Post('privacy-policy')
  async createOrUpdatePrivacyPolicy(@Body() body: { title: string; content: string }) {
    try {
      return await this.pagesService.createOrUpdate('privacy-policy', body.title, body.content);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create or update page',
      };
    }
  }

  @Post('user-agreement')
  async createOrUpdateUserAgreement(@Body() body: { title: string; content: string }) {
    try {
      return await this.pagesService.createOrUpdate('user-agreement', body.title, body.content);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create or update page',
      };
    }
  }

  @Get('about-us')
  async getAboutUs() {
   try {
     return await this.pagesService.getPage('about-us');
   } catch (error) {
     return {
       success: false,
       message: 'Failed to get page',
     };
   }
  }

  @Get('privacy-policy')
  async getPrivacyPolicy() {
    try {
      return await this.pagesService.getPage('privacy-policy');
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get page',
      };
    }
  }

  @Get('user-agreement')
  async getUserAgreement() {
    try {
      return await this.pagesService.getPage('user-agreement');
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get page',
      };
    }
  }
}
