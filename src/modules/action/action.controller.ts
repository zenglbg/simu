import { Controller, Get, Render, Body, Post, Response } from '@nestjs/common';
import { ActionService } from './action.service';

@Controller('user')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

 
  // @Get()
  // @Render('default/user')
  // index() {
  //   return { name: '张三' };
  // }

  // @Post('doAdd')
  // doAdd(@Body() body: any, @Response() res: any) {
  //   console.log(body);

  //   res.redirect('/user'); //路由跳转
  // }
}
