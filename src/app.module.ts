import { Module } from '@nestjs/common';
import { Index } from './modules/index/index.module';

import { Simu } from './modules/simu/simu.module';

import { ActionModule } from './modules/action/action.module';

import { ConfigModule } from './modules/config/config.module';

@Module({
  imports: [Index, Simu, ActionModule, ConfigModule],
})
export class AppModule {}
