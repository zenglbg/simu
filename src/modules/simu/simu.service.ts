import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';
import { MyBrowser } from 'src/common/libs/browser';

@Injectable()
export class SimuService {
  browser: MyBrowser;
  constructor() {
    this.browser = new MyBrowser();
  }

  public async option(id: number) {
    const source = 'philosophy.fudan.edu.cn';
    const maxLoop = 10;
    try {
      const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
      });
      // const newPage = await this.browser.gotobaidu(browser);
      // 空白页访问指定网址

      // 360出现验证直接使用前往百度
      const newPage = await browser.newPage();
      await newPage.goto('https://www.baidu.com', {
        waitUntil: 'domcontentloaded',
      });
      // 360出现验证直接使用前往百度

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
      await newPage.waitFor(5 * 1000);
      // 获取百度搜索结果目标网址title文字
      const resultTitle = await newPage.evaluate(source => {
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
      console.log(`成功获取目标网址百度ttile:${resultTitle}`);
      // 等待两秒
      await newPage.waitFor(2 * 1000);

      await (async function loop(n) {
        console.log(`第${n}次循环`);
        console.log(`选取输入框`);
        const input = await newPage.$('#kw');
        console.log(`单击输入框三次`);
        await input.click({ clickCount: 3 });
        console.log(`输入目标搜索文字`);
        await input.type(resultTitle, {
          delay: 100,
        });
        // 回车
        await newPage.keyboard.press('Enter');
        console.log('等待百度搜索结果渲染');
        await newPage.waitForSelector('.c-showurl');
        console.log('获取所有百度结果');
        const text = await newPage.$eval(
          '#content_left',
          node => node.innerHTML,
        );
        console.log('是否寻找到目标网址', new RegExp(source, 'g').test(text));
        const isFind = new RegExp(source, 'g').test(text);
        // 等待两秒
        await newPage.waitFor(2 * 1000);
        if (isFind) {
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
          // 等待两秒
          await newPage.waitFor(2 * 1000);
          console.log(`点击前往目标页面：：：：${sourceHashLink}`);
          await newPage.click(`a[href="${sourceHashLink}"]`);
        } else {
          console.log('当前百度页没有目标网址，点击下一页');
          await newPage.click('.page-inner>a:last-child');
          n > 0 && (await loop(n - 1));
        }
      })(maxLoop);

      console.log(`循环结束`);
      // if (isFind) {
      //   console.log(`执行跳转目标页面`);
      //   await page.evaluate(_ => {
      //     window.location.href = 'http://bdfhshfhjdf.com.cn';
      //   });
      // }

      await newPage.waitFor(30 * 1000);

      await browser.close();
    } catch (error) {
      console.log(error, `发生了错误`);
    }
  }
}
