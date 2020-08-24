import { Controller, Post, Get, Param } from '@nestjs/common';
import { SimuService } from './simu.service';

@Controller('simu')
export class SimuController {
  constructor(private readonly simuService: SimuService) {}


  @Post('option/:id')
  public option(@Param('id') id: number) {
    console.log(id)
    return this.simuService.option(id);
  }
}
