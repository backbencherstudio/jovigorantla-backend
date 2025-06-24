import { Controller, Get} from '@nestjs/common';
import { PagesService } from './pages.service';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // @Get()
  // async findAll() {
  //   try {
  //     return this.pagesService.getAllPages();
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: 'Failed to get pages',
  //     };
  //   }
  // }

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
      }
    }
  }

  
}
