import { MyBrowser } from './browser';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { Page } from 'puppeteer';
import axios from 'axios';
import * as path from 'path';

process.on('message', value => {
  console.log('Message from parent:', value);

  // new Simu();
  if (value.type == 'start') {
    new Simu(value.data);
  }
});

/**
 * 通过子进程开启模拟
 *
 */

class Simu {
  counter = 0; // 内部计算进度
  browser: MyBrowser; //浏览器常用工具
  proxy_url: string; // 代理地址
  resultTitle: string; // 目标title
  isFind: boolean; // 是否寻找到目标

  constructor(
    private body: {
      source: any;
      loop: any;
      debug: any;
      ips: any;
      isJs: boolean;
    },
  ) {
    this.browser = new MyBrowser();
    this.init();
  }

  init() {
    console.log(`我初始化了`);
    // this.timer();
    this.start();
  }

  testProxy = async (page: Page) => {
    if (page) {
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
    } else {
      throw new Error(`发生了错误在测试代理函数`);
    }
  };

  public getProxy = (order, num = 1, pt = 1, sep = 1) => (): Promise<any> =>
    axios
      .get(
        `http://dps.kdlapi.com/api/getdps/?orderid=${order}&num=${num}&pt=${pt}&sep=${sep}`,
      )
      .then(res => {
        const { data } = res;
        this.proxy_url = data.replace(/\s+/g, '');
        console.log(`成功获取代理ip`, this.proxy_url);
        return this.start();
      });

  public async start() {
    try {
      const { source, loop, debug } = this.body;

      // const newPage = await this.browser.gotobaidu(browser);
      // 空白页访问指定网址
      // 代理服务器ip和端口
      await this.browser.init({
        headless: !debug,
        devtools: !!debug,
        args: [this.proxy_url ? `--proxy-server=http://${this.proxy_url}` : ''],
      });
      const page = await this.browser.page;
      console.log(`删除cookie`);
      await page.deleteCookie();
      // await this.browser.changeProxy(page)(this.proxy_url);
      // # 等待指定时间 ，second
      await this.browser.waitS(page, 2);

      // 可以删除
      // this.testProxy()
      // 可以删除
      // 通过360前往百度返回一个已经在百度的页面
      const newPage = await this.browser.gotobaidu(page, this.body.isJs);
      console.log(`删除cookie`);
      await newPage.deleteCookie();
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
          return (document.querySelector(
            `a[href="${resultKey}"]`,
          ) as HTMLElement).innerText;
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

      console.log(`等待3秒`);
      await newPage.waitFor(3 * 1000);
      console.log(`开始执行模拟`);
      await this.simu(newPage);

      /**
       * @todo 模拟操作目标页面
       */

      await this.browser.browser.close();

      process.send({ counter: this.counter++ });
      this.start();
    } catch (error) {
      await this.browser.browser.close();

      process.send({ counter: this.counter++ });
      this.start();
    }
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

  simu = async (page: Page): Promise<any> => {
    switch (this.counter) {
      case 0:
        await this.browser.rdmMove(page);
        break;
      case 1:
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);

        break;
      case 2:
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.backMain(page);
        await this.browser.rdmMove(page);
        await this.browser.backPage(page);
        break;
      case 3:
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.backPage(page);
        await this.browser.rdmMove(page);
        break;
      case 4:
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        break;
      case 5:
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.backPage(page);
        await this.browser.rdmMove(page);
        break;
      case 6:
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.backPage(page);
        await this.browser.rdmMove(page);
        await this.browser.backPage(page);
        await this.browser.rdmMove(page);
        break;
      case 7:
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.backMain(page);
        const page7_1 = await this.browser.rdmNewPage(page);
        await this.browser.rdmMove(page7_1);
        const page7_2 = await this.browser.rdmNewPage(page);
        await this.browser.rdmMove(page7_2);
        break;
      case 8:
        await this.browser.rdmMove(page);
        await this.browser.rdmPage(page);
        await this.browser.rdmMove(page);
        await this.browser.backMain(page);
        const page8_1 = await this.browser.rdmNewPage(page);
        await this.browser.rdmMove(page8_1);
        const page8_2 = await this.browser.rdmNewPage(page);
        await this.browser.rdmMove(page8_2);
        const page8_3 = await this.browser.rdmNewPage(page);
        await this.browser.rdmMove(page8_3);
        const page8_4 = await this.browser.rdmNewPage(page);
        await this.browser.rdmMove(page8_4);
        const page8_5 = await this.browser.rdmNewPage(page);
        await this.browser.rdmMove(page8_5);

      default:
        break;
    }

    return 1;
  };
}
