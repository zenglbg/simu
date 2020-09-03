import * as puppeteer from "puppeteer";
import { Page, Browser, LaunchOptions } from "puppeteer";
import * as useProxy from "puppeteer-page-proxy";
import { arrRange } from "./array";
import { rdmMaxRound, rdmMaxFloor } from "./random";
export class MyBrowser {
  //  360浏览器头
  UA = "User-Agent: Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; 360SE)";
  browser: Browser;
  page: Page;

  async init(option?: LaunchOptions): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      ...option,
    });

    // 创建空白页(新选项卡)
    this.page = await this.browser.newPage();

    await Promise.all([
      // 设置浏览器头
      this.page.setUserAgent(this.UA),
      // 允许执行js脚本
      this.page.setJavaScriptEnabled(true),
      // 页面视口大小
      this.page.setViewport({
        width: 1280,
        height: 600,
      }),
    ]);
  }

  async gotobaidu(page: Page, isJs: boolean): Promise<Page> {
    /**
     * 从360搜索并进入百度页面
     */
    // 空白页访问指定网址
    await page.goto("https://www.so.com/", {
      waitUntil: "domcontentloaded",
    });

    // # 等待指定时间 ，second
    await this.waitS(page, 2);

    // # 等待某元素显示
    await page.waitForSelector("body");

    // 获取页面的标题
    const title = await page.title();
    console.info(`标题是: ${title}`);

    // 焦点设置到搜索输入
    await page.focus("#input");

    // 将文本键入焦点元素
    await page.keyboard.type("baidu", { delay: 100 });

    // 回车
    await page.keyboard.press("Enter");

    // 等待360搜索结果渲染
    await page.waitForSelector(".result");
    console.log(`点击百度链接`);
    // 点击百度链接
    await page.click('a[href="https://www.baidu.com/"]');
    // 等待五秒
    await page.waitFor(5 * 1000);
    // 获取新打开的百度页面

    return await this.getLastPage(isJs);
    // 获取新打开的百度页面
  }

  public async getLastPage(isJs: boolean) {
    const pageList = await this.browser.pages();
    const newPage = pageList[pageList.length - 1];
    await newPage.setJavaScriptEnabled(isJs);

    return newPage;
  }

  changeProxy(page: Page) {
    /**
     * 切换页面代理
     */
    return async function (proxy_url: string) {
      console.log(proxy_url);
      await useProxy(page, `http://${proxy_url}`);
    };
  }

  async autoScroll(page) {
    /**
     * 自动滚动到底部
     */
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        var totalHeight = 0;
        var distance = 100;
        var timer = setInterval(() => {
          var scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  async rdmMove(page: Page): Promise<void> {
    /**
     * 随机移动点击功能
     */
    console.log(`随机移动点击功能`);
    await page.waitFor(3 * 1000);

    const { width, height } = await page.viewport();
    // await (async function moveClick(loopTime) {
    for (const loopTime of arrRange(5)) {
      console.log(`第${loopTime} 随机移动点击`);
      await page.waitFor(2 * 1000);

      console.log(`获取xy随机值`);
      const [x, y] = [rdmMaxRound(width), rdmMaxRound(height)];
      console.log(`移动鼠标`, x, y);
      await page.mouse.move(x, y);
      console.log(`等待2秒`);
      await page.waitFor(2 * 1000);
      console.log(`随机点击页面`);
      await page.mouse.click(x, y);
      await page.waitFor(2 * 1000);
    }
    console.log(`完成随机移动点击`);
    // })(10);
  }

  async rdmPage(page: Page): Promise<void> {
    /**
     * 随机进入内页功能
     */
    console.log(`随机进入内页功能,等待5秒渲染时间`);
    await page.waitFor(5 * 1000);
    console.log(`获取所有内页长度`);
    const href = await page.evaluate(() => {
      const alist = document.querySelectorAll(`a[href]`);
      const len = alist.length;
      const key = Math.floor(Math.random() * len + 1);
      const href = alist[key].getAttribute("href");
      window.location.href = href;
      return href;
    }, null);
    console.log(`随机点击所有内页中的一个---a[href="${href}"]`);
    /**
     * 不是正在展示的页面不能进行点击事件
     */

    // await page.click(`a[href="${href}"]`);
    // await page.$(`a[href="${href}"]`).click();
    console.log(`随机进入内页功能,等待5秒渲染时间`);
    await page.waitFor(5 * 1000);
  }

  async rdmNewPage(page: Page): Promise<Page> {
    /**
     * 随机进入新的内页功能
     */
    console.log(`随机进入内页功能`);
    await page.waitFor(3 * 1000);

    console.log(`随机点击所有内页中的一个`);
    const link = await page.evaluate((el) => {
      const alist = document.querySelectorAll(`a[href]`);
      const len = alist.length;
      const key = Math.floor(Math.random() * len + 1);
      return alist[key].getAttribute("href");
    }, null);
    console.log(`打开一个新页面`);
    const newPage = await this.browser.newPage();
    console.log(`开始情网href====》 ${link}`);
    await newPage.goto(link);
    console.log(`打开新页面等待5秒的渲染时间`);
    await this.waitS(newPage, 5);
    console.log(`返回新的页面`);
    return newPage;
  }

  async backMain(page: Page): Promise<void> {
    /**
     * 返回主页面功能
     */
    console.log(`返回第一个页面`);
    await page.waitFor(3 * 1000);

    await page.evaluate(() => {
      window.location.href = "/";
    });
  }

  async backPage(page: Page): Promise<void> {
    /**
     * 返回上级页面
     */
    console.log(`返回上级页面`);
    await page.waitFor(3 * 1000);

    await page.evaluate(() => {
      window.history.back();
    });
  }

  selectPage = async (lastPage = 0) => {
    /**
     * @{params} lastPage: 到处第几个页面
     */
    const pageList = await this.browser.pages();
    return pageList[pageList.length - lastPage - 1];
  };

  async waitS(page: Page, n: number): Promise<void> {
    /**
     * 登录秒数
     */
    await page.waitFor(n * 1000);
  }
}
