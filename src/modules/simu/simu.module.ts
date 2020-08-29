import { Module, HttpModule } from '@nestjs/common';
import { SimuController } from './simu.controller';
import { SimuService } from './simu.service';
import { ConfigModule } from '../config/config.module';
@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [SimuController],
  providers: [SimuService],
})
export class Simu {}
