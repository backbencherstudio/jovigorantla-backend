import { Module } from '@nestjs/common';
import { FaqModule } from './faq/faq.module';
import { ContactModule } from './contact/contact.module';
import { WebsiteInfoModule } from './website-info/website-info.module';
import { PaymentTransactionModule } from './payment-transaction/payment-transaction.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { AdsModule } from './ads/ads.module';
import { ListingsModule } from './listings/listings.module';
import { AdsGroupModule } from './ads-group/ads-group.module';
import { PagesModule } from './pages/pages.module';

@Module({
  imports: [
    FaqModule,
    ContactModule,
    WebsiteInfoModule,
    PaymentTransactionModule,
    UserModule,
    NotificationModule,
    AdsModule,
    ListingsModule,
    AdsGroupModule,
    PagesModule,
  ],
})
export class AdminModule {}
