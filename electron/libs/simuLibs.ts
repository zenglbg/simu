import { MyBrowser } from "./browser";
import { Page } from "puppeteer";
import axios from "axios";
import { arrRange } from "./array";

process.on("message", (value) => {
  console.log("Message from parent:", value);

  // new Simu();
  if (value.type == "start") {
    new SimuLibs(value.data);
  }
});

/**
 * 通过子进程开启模拟
 *
 */

interface InfoBody {
  source: string;
  order: string;
  loop: number;
  ips: number;
  debug: boolean;
  isJs: boolean;
}

export class SimuLibs {
  counter = 0; // 内部计算进度
  browser: MyBrowser; //浏览器常用工具
  proxy_url: string; // 代理地址
  resultTitle: string; // 目标title
  isFind: boolean; // 是否寻找到目标

  constructor(private body: InfoBody) {
    this.browser = new MyBrowser();
    this.init();
  }

  async init() {
    try {
      console.log(`我初始化了`);
      // this.timer();
      console.log(`获取代理`);

      console.log(`监听停止事件`);

      process.on("message", (value) => {
        console.log("Message from parent:", value);

        // new Simu();
        if (value.type == "stop") {
          this.counter = this.body.ips;
          this.getError();
        }
      });
      this.getProxy(this.body.order);

      /**
       * 测试模拟
       */
      // this.counter = 7;
      // this.testSimu(`http://ucheke.jrj.com.cn/`);
      /**
       * 测试模拟
       */
    } catch (error) {
      console.log(error, `libs 的init 发生了错误`);
    }

    // this.start();
  }

  public testProxy = async (page: Page) => {
    if (page) {
      await page.goto("https://www.baidu.com/", {
        waitUntil: "domcontentloaded",
      });
      console.log(`等待百度表单渲染`);
      await page.waitForSelector("#kw");
      // # 等待指定时间 ，second
      await this.browser.waitS(page, 2);
      // 焦点设置到搜索输入
      await page.focus("#kw");
      // 将文本键入焦点元素
      await page.keyboard.type("ip", { delay: 100 });
      // 回车
      await page.keyboard.press("Enter");
      // # 等待指定时间 ，second
      await this.browser.waitS(page, 5);
    } else {
      throw new Error(`发生了错误在测试代理函数`);
    }
  };

  public async getError() {
    await this.browser.browser.close();

    process.send({ counter: this.counter++ });
    if (this.counter < this.body.ips) {
      this.start();
    }
  }
  public getProxy = async (order: string, num = 1, pt = 1, sep = 1) => {
    console.log(
      "获取代理",
      111,
      `http://dps.kdlapi.com/api/getdps/?orderid=${order}&num=${num}&pt=${pt}&sep=${sep}`
    );
    if (this.counter < this.body.ips) {
      await axios
        .get(
          `http://dps.kdlapi.com/api/getdps/?orderid=${order}&num=${num}&pt=${pt}&sep=${sep}`
        )
        .then(
          ({ code, data, msg }: any) => {
            if (data) {
              this.proxy_url = data.replace(/\s+/g, "");
              console.log(`成功获取代理ip`, this.proxy_url);
              return this.start();
            } else {
              process.send({ msg: `发生了错误：${msg}` });
            }
          },
          (err) => {
            console.log(err);
            process.send({ msg: `发生了错误：${err}` });
            this.getError();
          }
        );
    }
  };

  public async start() {
    try {
      const { source, loop, debug } = this.body;

      // 空白页访问指定网址
      // 代理服务器ip和端口
      await this.browser.init({
        headless: !debug,
        devtools: !!debug,
        args: [this.proxy_url ? `--proxy-server=http://${this.proxy_url}` : ""],
      });
      const page = await this.browser.page;
      // 可以删除 ， 通过搜索百度ip 测试代理是否生效
      await this.testProxy(page);
      // 可以删除 ， 通过搜索百度ip 测试代理是否生效

      console.log(`删除cookie`);
      await page.deleteCookie();
      // await this.browser.changeProxy(page)(this.proxy_url);
      // # 等待指定时间 ，second
      await this.browser.waitS(page, 2);

      // 通过360前往百度返回一个已经在百度的页面
      const newPage = await this.browser.gotobaidu(page, this.body.isJs);
      console.log(`删除cookie`);
      await newPage.deleteCookie();
      // 通过360前往百度返回一个已经在百度的页面

      // 360出现验证直接使用前往百度
      // const newPage = await this.browser.page;
      // this.proxy_url &&
      //   (await this.browser.changeProxy(newPage)(this.proxy_url));
      // await newPage.goto("http://baidu.com", {
      //   waitUntil: "domcontentloaded",
      // });
      // 360出现验证直接使用前往百度

      console.log(`等待百度表单渲染`);
      await newPage.waitForSelector("#kw");
      // # 等待指定时间 ，second
      await this.browser.waitS(newPage, 2);
      // 焦点设置到搜索输入
      await newPage.focus("#kw");
      // 将文本键入焦点元素
      await newPage.keyboard.type(source, { delay: 100 });
      // 回车
      await newPage.keyboard.press("Enter");

      // 等待百度搜索结果渲染
      await newPage.waitForSelector(".c-showurl");
      // 手动再等待2秒
      await newPage.waitFor(10 * 1000);
      // 获取百度搜索结果目标网址title文字
      this.resultTitle = await newPage.evaluate((source) => {
        console.log(`进入浏览器内部操作，`);
        try {
          const resultKey = Array.from(
            document.querySelectorAll(".c-showurl")
          ).reduce((acc: string, item: HTMLElement) => {
            console.log(
              item,
              item.innerText,
              new RegExp(source, "g").test(item.innerText)
            );
            return new RegExp(source, "g").test(item.innerText)
              ? item.getAttribute("href")
              : acc;
          }, null);
          console.log(`目标网站百度生成的hash值链接1`, resultKey);
          return (document.querySelector(
            `a[href="${resultKey}"]`
          ) as HTMLElement).innerText;
        } catch (error) {
          console.log(error, `不知道发生了什么错误！`);
        }

        // 获取目标网址百度搜索title
      }, source);
      console.log(`成功获取目标网址百度ttile:${this.resultTitle}`);

      // 等待百度搜索结果渲染
      await newPage.waitForSelector(".c-showurl");
      // 等待两秒
      await newPage.waitFor(5 * 1000);
      console.log(`循环遍历百度结果寻找目标title`);
      await this.makeLoop(newPage, loop);
      console.log(`循环结束`);

      console.log(`等待3秒`);
      await newPage.waitFor(3 * 1000);

      console.log(`获取最新模拟页面`);
      const lastPage = await this.browser.getLastPage(this.body.isJs);

      console.log(`开始执行模拟`);
      await this.simu(lastPage);
    } catch (error) {
      console.log(error);
      this.getError();
    }
  }

  public makeLoop = async (newPage: Page, loop: number) => {
    for await (const loopItem of arrRange(loop)) {
      const { source } = this.body;
      console.log(`第${loopItem}次循环`);
      console.log(`选取输入框`);
      const input = await newPage.$("#kw");
      console.log(`单击输入框三次`);
      await input.click({ clickCount: 3 });
      console.log(`输入目标搜索文字`);
      await input.type(this.resultTitle, {
        delay: 100,
      });
      // 回车
      await newPage.keyboard.press("Enter");
      console.log("等待百度搜索结果渲染");
      await newPage.waitForSelector(".c-showurl");
      // 等待两秒
      await newPage.waitFor(5 * 1000);
      console.log("获取所有百度结果");
      const text = await newPage.$eval(
        "#content_left",
        (node) => node.innerHTML
      );
      console.log("是否寻找到目标网址", new RegExp(source, "g").test(text));
      this.isFind = new RegExp(source, "g").test(text);
      // 等待两秒
      await newPage.waitFor(2 * 1000);
      if (this.isFind) {
        const sourceHashLink = await newPage.evaluate((source) => {
          const resultKey = Array.from(
            document.querySelectorAll(".c-showurl")
          ).reduce((acc: string, item: HTMLElement) => {
            console.log(item, item.innerText);
            return new RegExp(source, "g").test(item.innerText)
              ? item.getAttribute("href")
              : acc;
          }, null);
          console.log(`目标网站百度生成的hash值链接2`, resultKey);
          return resultKey;
        }, source);
        console.log("等待百度搜索结果渲染");
        await newPage.waitForSelector(".c-showurl");
        console.log(`点击前往目标页面：：：：${sourceHashLink}`);
        await newPage.click(`a[href="${sourceHashLink}"]`);
        console.log(`跳出遍历百度结果页`);
        break;
      } else {
        console.log(`开始滚动到百度页面底部`);
        await this.browser.autoScroll(newPage);
        console.log(`等待一段事件`);
        await newPage.waitFor(3 * 1000);
        console.log("当前百度页没有目标网址，点击下一页");
        await newPage.click(".page-inner>a:last-child");
      }
    }
  };

  public async testSimu(href) {
    await this.browser.init({
      headless: !true,
      devtools: !!true,
    });
    const page = await this.browser.page;
    await page.goto(href);
    await this.simu(page);
  }

  public simu = async (page: Page) => {
    try {
      console.log(`监听页面弹出`);
      page.on("dialog", async (dialog) => {
        console.log(`打印出弹框的信息`, dialog.message());
        await page.waitFor(2000); //特意加两秒等可以看到弹框出现后取消
        await dialog.dismiss();
      });
      switch (this.counter % 9) {
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
          break;
      }
      console.log(`关闭浏览器`);
      await this.browser.browser.close();
      console.log(`结束模拟`);

      process.send({ counter: this.counter++ });
      console.log(`继续执行下一个模拟`);
      // this.getProxy(this.body.order);
      this.testSimu(`http://ucheke.jrj.com.cn/`);
    } catch (error) {
      console.log(`模拟发生了错误： ${error}`);
      this.getError();
    }
  };
}
