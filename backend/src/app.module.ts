import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma';
import { AuthModule } from './modules/auth';
import { ProductsModule } from './modules/products';
import { CategoriesModule } from './modules/categories';
import { OrdersModule } from './modules/orders';
import { SettingsModule } from './modules/settings';
import { UploadModule } from './modules/upload';
import { GeminiModule } from './modules/gemini';
import { AppointmentsModule } from './modules/appointments';
import { TicketsModule } from './modules/tickets';
import { SupportedDevicesModule } from './modules/supported-devices/supported-devices.module';
import { RepairsModule } from './modules/repairs/repairs.module';
import { UsersModule } from './modules/users/users.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { InvoiceModule } from './modules/invoice';
import { SmsModule } from './modules/sms';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { BannersModule } from './modules/banners/banners.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { AuditLogModule } from './modules/audit-logs/audit-log.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { StockNotificationsModule } from './modules/stock-notifications/stock-notifications.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting - default 100 requests per 60 seconds
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds in milliseconds
        limit: 100, // 100 requests per ttl window
      },
    ]),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    SettingsModule,
    UploadModule,
    GeminiModule,
    AppointmentsModule,
    TicketsModule,
    SupportedDevicesModule,
    RepairsModule,
    FeedbackModule,
    MarketingModule,
    InvoiceModule,
    SmsModule,
    DiscountsModule,
    BannersModule,
    InventoryModule,
    ShippingModule,
    AnalyticsModule,
    RefundsModule,

    // New feature modules
    AuditLogModule,
    ReviewsModule,
    WishlistModule,
    StockNotificationsModule,
    ExportModule,
  ],


  controllers: [],
  providers: [],
})
export class AppModule { }
