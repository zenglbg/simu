import { Controller, Post, Get, Param, Body, Session } from '@nestjs/common';
import { SimuService } from './simu.service';
@Controller('simu')
export class SimuController {
  constructor(private readonly simuService: SimuService) {}

  @Post('start')
  public start(@Body() body: { source: any; loop: any; debug: any; ips: any }) {
    return this.simuService.start(body);
  }
  @Post('start1')
  public start1(
    @Body() body: { source: any; loop: any; debug: any; ips: any },
  ) {
    return this.simuService.start1(body);
  }

  @Post('stop')
  public stop(@Body('allowed') allowed?: boolean) {
    return this.simuService.stop(allowed);
  }
  @Post('changefalse')
  public changefalse() {
    return this.simuService.changefalse();
  }
  @Post('changetrue')
  public changetruep() {
    return this.simuService.changetrue();
  }
  @Post('newsimu')
  public newsimu() {
    return this.simuService.newsimu();
  }
}
