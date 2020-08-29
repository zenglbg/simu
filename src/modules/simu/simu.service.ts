import { Injectable, HttpService } from '@nestjs/common';
import { MyBrowser } from 'src/common/libs/browser';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { from } from 'rxjs';
import { Page } from 'puppeteer';
import { polling } from '../../common/libs/restry';
import { allow } from '@hapi/joi';
import { fork, ChildProcess } from 'child_process';
import * as path from 'path';
interface MockRequestResponse {
  status: string;
  count: number;
}

@Injectable()
export class SimuService {
  child: ChildProcess = null; // 全局模拟子进程模块
  browser: MyBrowser; //浏览器常用工具
  proxy_url: string; //代理地址
  isFind: boolean; // 是否寻找到目标
  resultTitle: string; // 寻找的的目标网页百度搜索结果title
  body: {
    source: any;
    loop: any;
    debug: any;
    ips: any;
    isJs: boolean;
  };
  count = 0; // 执行进度，0为第一个任务
  isStart = false;
  allowed = true; // @todo 待删除功能

  constructor(
    public readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.browser = new MyBrowser();
  }

  testProxy = async (page: Page) => {
    await page.goto('https://www.baidu.com/', {
      waitUntil: 'domcontentloaded',
    });
    console.log(`等待百度表单渲染`);
    await page.waitForSelector('#kw');
    // # 等待指定时间 ，second
    await this.browser.waitS(page, 2);
    // 焦点设置到搜索输入
    await page.focus('#kw');
    // 将文本键入焦点元素
    await page.keyboard.type('ip', { delay: 100 });
    // 回车
    await page.keyboard.press('Enter');
    // # 等待指定时间 ，second
    await this.browser.waitS(page, 2000);
  };

  public getProxy = (order, num = 1, pt = 1, sep = 1) => (): Observable<any> =>
    this.httpService
      .get(
        `http://dps.kdlapi.com/api/getdps/?orderid=${order}&num=${num}&pt=${pt}&sep=${sep}`,
      )
      .pipe(
        switchMap(res => {
          const { data } = res;
          this.proxy_url = data.replace(/\s+/g, '');
          console.log(this.proxy_url);
          return from(this.simu());
        }),
      );

  public async simu() {
    const { source, loop, debug } = this.body;

    // const newPage = await this.browser.gotobaidu(browser);
    // 空白页访问指定网址
    // 代理服务器ip和端口
    await this.browser.init({
      headless: !debug,
      devtools: !!debug,
      args: [`--proxy-server=http://${this.proxy_url}`],
    });
    // 通过360前往百度返回一个已经在百度的页面
    const page = await this.browser.page;
    // await this.browser.changeProxy(page)(this.proxy_url);
    // # 等待指定时间 ，second
    await this.browser.waitS(page, 2);

    // 可以删除
    // this.testProxy()
    // 可以删除

    const newPage = await this.browser.gotobaidu(page, this.body.isJs);
    // 通过360前往百度返回一个已经在百度的页面

    // 360出现验证直接使用前往百度
    // const newPage = await this.browser.page;
    // this.proxy_url && (await this.browser.changeProxy(newPage)(this.proxy_url));
    // await newPage.goto('http://baidu.com', {
    //   waitUntil: 'domcontentloaded',
    // });
    // 360出现验证直接使用前往百度

    console.log(`等待百度表单渲染`);
    await newPage.waitForSelector('#kw');
    // # 等待指定时间 ，second
    await this.browser.waitS(newPage, 2);
    // 焦点设置到搜索输入
    await newPage.focus('#kw');
    // 将文本键入焦点元素
    await newPage.keyboard.type(source, { delay: 100 });
    // 回车
    await newPage.keyboard.press('Enter');

    // 等待百度搜索结果渲染
    await newPage.waitForSelector('.c-showurl');
    // 手动再等待2秒
    await newPage.waitFor(10 * 1000);
    // 获取百度搜索结果目标网址title文字
    this.resultTitle = await newPage.evaluate(source => {
      console.log(`进入浏览器内部操作，`);
      try {
        const resultKey = Array.from(
          document.querySelectorAll('.c-showurl'),
        ).reduce((acc: string, item: HTMLElement) => {
          console.log(
            item,
            item.innerText,
            new RegExp(source, 'g').test(item.innerText),
          );
          return new RegExp(source, 'g').test(item.innerText)
            ? item.getAttribute('href')
            : acc;
        }, null);
        console.log(`目标网站百度生成的hash值链接1`, resultKey);
        return (document.querySelector(`a[href="${resultKey}"]`) as HTMLElement)
          .innerText;
      } catch (error) {
        console.log(error, `不知道发生了什么错误！`);
      }

      // 获取目标网址百度搜索title
    }, source);
    console.log(`成功获取目标网址百度ttile:${this.resultTitle}`);

    // 等待百度搜索结果渲染
    await newPage.waitForSelector('.c-showurl');
    // 等待两秒
    await newPage.waitFor(5 * 1000);
    await this.loop(newPage, loop);

    console.log(`循环结束`);

    console.log(`等待30秒`);
    await newPage.waitFor(30 * 1000);

    /**
     * @todo 模拟操作目标页面
     */

    // await this.browser.browser.close();
  }

  public loop = async (newPage, loop) => {
    const { source } = this.body;
    console.log(`第${loop}次循环`);
    console.log(`选取输入框`);
    const input = await newPage.$('#kw');
    console.log(`单击输入框三次`);
    await input.click({ clickCount: 3 });
    console.log(`输入目标搜索文字`);
    await input.type(this.resultTitle, {
      delay: 100,
    });
    // 回车
    await newPage.keyboard.press('Enter');
    console.log('等待百度搜索结果渲染');
    await newPage.waitForSelector('.c-showurl');
    // 等待两秒
    await newPage.waitFor(5 * 1000);
    console.log('获取所有百度结果');
    const text = await newPage.$eval('#content_left', node => node.innerHTML);
    console.log('是否寻找到目标网址', new RegExp(source, 'g').test(text));
    this.isFind = new RegExp(source, 'g').test(text);
    // 等待两秒
    await newPage.waitFor(2 * 1000);
    if (this.isFind) {
      const sourceHashLink = await newPage.evaluate(source => {
        const resultKey = Array.from(
          document.querySelectorAll('.c-showurl'),
        ).reduce((acc: string, item: HTMLElement) => {
          console.log(item, item.innerText);
          return new RegExp(source, 'g').test(item.innerText)
            ? item.getAttribute('href')
            : acc;
        }, null);
        console.log(`目标网站百度生成的hash值链接2`, resultKey);
        return resultKey;
      }, source);
      console.log('等待百度搜索结果渲染');
      await newPage.waitForSelector('.c-showurl');
      console.log(`点击前往目标页面：：：：${sourceHashLink}`);
      await newPage.click(`a[href="${sourceHashLink}"]`);
    } else {
      console.log('当前百度页没有目标网址，点击下一页');
      await newPage.click('.page-inner>a:last-child');
      loop > 0 &&
        (await this.loop(newPage, {
          source,
          loop: loop - 1,
        }));
    }
  };

  public mockRequest = (): Promise<MockRequestResponse> => {
    return new Promise((resolve, reject) => {
      this.browser.browser && this.browser.browser.close();
      console.log(
        `是否被允许执行${this.allowed}，和是否已经开始执行${this.isStart}`,
      );
      if (this.allowed) {
        this.getProxy(959860183444469)().subscribe(
          res => {
            if (this.count < this.body.ips) {
              resolve({
                status: 'pending',
                count: this.count,
              });
            } else {
              resolve({
                status: 'finish',
                count: this.count,
              });
            }
            this.count++;
          },
          err => reject(err),
        );
      } else {
        throw new Error(`主动停止模拟，`);
      }
    });
  };

  public start1 = (body: {
    source: any;
    loop: any;
    debug: any;
    ips: any;
    isJs: boolean;
  }): any => {
    this.body = body;
    if (this.isStart == true) {
      return {
        code: 200,
        msg: '正在执行中',
        data: { body },
      };
    } else {
      this.isStart = true;

      polling({
        try: this.mockRequest,
        tryRequest: this.count,
        retryUntil: res => {
          console.log(new Date().toLocaleString(), res);
          return res.status === 'finish';
        },
        tick: 1000,
        maxTimes: this.body.ips,
      }).subscribe(
        response => {
          console.log('轮询结束: ', response);
          this.initConfig();
        },
        (err: Error) => {
          console.log(err.message, `发生了错误 start`);
          this.initConfig();
        },
      );

      return {
        code: 200,
        msg: '开始执行模拟',
        data: { body },
      };
    }
  };

  public stop = async (allowed = false) => {
    if (this.isStart) {
      this.allowed = allowed;
      return {
        code: 200,
        msg: '已执行停止，请稍后！',
      };
    } else {
      return {
        code: 200,
        msg: '程序未开始运行',
      };
    }
  };

  public initConfig = () => {
    this.browser.browser && this.browser.browser.close();
    this.isStart = false;
    this.allowed = true;
    this.count = 0;
  };
  public start = async (body: {
    source: any;
    loop: any;
    debug: any;
    ips: any;
    isJs: boolean;
  }): Promise<any> => {
    this.body = body;
    if (this.isStart == true) {
      return {
        code: 200,
        msg: '正在执行中',
        data: { body },
      };
    } else {
      this.isStart = true;

      this.getProxy(959860183444469)().subscribe(
        _ => {
          this.browser.browser && this.browser.browser.close();
          this.isStart = false;
          console.log(`完成`);
        },
        error => {
          console.log(error, `发生了错误 start`);
          this.browser.browser.close();
          this.isStart = false;
        },
      );

      return {
        code: 200,
        msg: '开始执行模拟',
        data: { body },
      };
    }
  };

  changefalse() {
    this.allowed = false;
    console.log(this.allowed);
    return this.allowed;
  }
  changetrue() {
    this.allowed = true;
    console.log(this.allowed);
    return this.allowed;
  }

  newstop = () => {
    if (this.child) {
      this.child.kill();
      console.log(`已执行杀死子进程`);
      return {
        code: 200,
        msg: '已执行停止',
      };
    } else {
      return {
        code: 200,
        msg: '未有任务在执行',
      };
    }
  };

  newsimu = (body: {
    source: any;
    loop: any;
    debug: any;
    ips: any;
    isJs: boolean;
  }): any => {
    if (!body.source) {
      return {
        code: 201,
        msg: `没有执行目标`,
      };
    }
    this.body = body;
    if (this.isStart) {
      return {
        code: 200,
        msg: '执行中',
        data: {
          count: this.count,
        },
      };
    } else {
      console.log(`存储执行状态`);
      this.isStart = true;

      this.child = fork(path.resolve(__dirname, '../../common/libs/simu.js'));
      this.child.on('message', msg => {
        console.log('Message from child', msg);
        if (this.count > this.body.ips) {
          this.over();
        }
        this.count++;
      });
      this.child.send({
        type: 'start',
        data: this.body,
      });

      return {
        code: 200,
        msg: '开始执行',
        data: {
          count: this.count,
        },
      };
    }
  };

  over = () => {
    console.log(`结束子进程`);
    this.child.kill();
    this.count = 0;
    this.isStart = false;
  };
}
