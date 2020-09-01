import * as puppeteer from "puppeteer";
import { Page, Browser, LaunchOptions } from "puppeteer";
import * as useProxy from "puppeteer-page-proxy";

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
    const pageList = await this.browser.pages();
    const newPage = pageList[pageList.length - 1];
    await newPage.setJavaScriptEnabled(isJs);

    return newPage;
    // 获取新打开的百度页面
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

  async rdmMove(page: Page): Promise<void> {
    /**
     * 随机移动点击功能
     */
    console.log(`随机移动点击功能`);
    await page.waitFor(3 * 1000);

    const { width, height } = await page.viewport();
    await (async function moveClick(loopTime) {
      const xy = [rdmMaxRound(width), rdmMaxRound(height)];
      await page.mouse.move.apply(null, xy);
      console.log(`获取所有非超链接`);
      const childrenPages = await page.$$(`body>div>div`);
      console.log(`随机点击所有内页中的一个`);
      await childrenPages[rdmMaxFloor(childrenPages.length)].click();
      await page.waitFor(2 * 1000);
      loopTime > 0 && moveClick(loopTime - 1);
    })(10);
  }

  async rdmPage(page: Page): Promise<void> {
    /**
     * 随机进入内页功能
     */
    console.log(`随机进入内页功能,等待5秒渲染时间`);
    await page.waitFor(5 * 1000);
    console.log(`获取所有内页`);
    const childrenPages = await page.$$(`a[href]`);
    console.log(`随机点击所有内页中的一个`);
    await childrenPages[rdmMaxFloor(childrenPages.length)].click();
  }

  async rdmNewPage(page: Page): Promise<Page> {
    /**
     * 随机进入内页功能
     */
    console.log(`随机进入内页功能`);
    await page.waitFor(3 * 1000);

    console.log(`获取所有内页`);
    const childrenPages = await page.$$(`a[href]`);
    console.log(`随机点击所有内页中的一个`);
    const link = await page.evaluate(
      (el) => el.getAttribute("href"),
      childrenPages[rdmMaxFloor(childrenPages.length)]
    );
    const newPage = await this.browser.newPage();
    await newPage.goto(link);
    console.log(`打开新页面等待5秒的渲染时间`);
    await this.waitS(newPage, 5);
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
