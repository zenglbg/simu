import { Module } from '@nestjs/common';
import { SimuController } from './simu.controller';
import { SimuService } from './simu.service';

@Module({
  controllers: [SimuController],
  providers: [SimuService],
})
export class Simu {}
