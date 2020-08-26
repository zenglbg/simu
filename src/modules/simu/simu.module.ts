import { Module } from '@nestjs/common';
import { SimuController } from './simu.controller';
import { SimuService } from './simu.service';
import { ConfigService } from '../config/config.service';
import { ConfigModule } from '../config/config.module';
@Module({
  imports: [ConfigModule],
  controllers: [SimuController],
  providers: [SimuService],
})
export class Simu {}
