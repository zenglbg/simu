import { Module } from '@nestjs/common';

import { Index } from './modules/index/index.module';

import { Simu } from './modules/simu/simu.module';

import { ActionModule } from './modules/action/action.module';

@Module({
  imports: [Index, Simu, ActionModule],
})
export class AppModule {}
