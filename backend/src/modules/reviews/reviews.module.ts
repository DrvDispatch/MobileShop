import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { GoogleReviewsService } from './google-reviews.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [ReviewsController],
    providers: [ReviewsService, GoogleReviewsService],
    exports: [ReviewsService, GoogleReviewsService],
})
export class ReviewsModule { }
