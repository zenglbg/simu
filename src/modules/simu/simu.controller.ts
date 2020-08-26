import { Controller, Post, Get, Param, Body, Session } from '@nestjs/common';
import { SimuService } from './simu.service';
@Controller('simu')
export class SimuController {
  constructor(private readonly simuService: SimuService) {}

  @Post('start')
  public option(
    @Body() body: { source: any; loop: any; debug: any; ips: any },
  ) {
    return this.simuService.start(body);
  }
}
