import { Module } from '@nestjs/common';
import { PagesService } from './pages.service';
import { PagesController } from './pages.controller';
import { OwnerPagesController } from './owner-pages.controller';
import { OwnerModule } from '../owner/owner.module';

@Module({
    imports: [OwnerModule],
    controllers: [PagesController, OwnerPagesController],
    providers: [PagesService],
    exports: [PagesService],
})
export class PagesModule { }
