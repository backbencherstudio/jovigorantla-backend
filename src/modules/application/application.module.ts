import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';
import { ContactModule } from './contact/contact.module';
import { FaqModule } from './faq/faq.module';
import { AdsModule } from './ads/ads.module';
import { ListingsModule } from './listings/listings.module';
import { FavoriteModule } from './favorite/favorite.module';
import { PagesModule } from './pages/pages.module';

@Module({
  imports: [NotificationModule, ContactModule, FaqModule, AdsModule, ListingsModule, FavoriteModule, PagesModule],
})
export class ApplicationModule {}
