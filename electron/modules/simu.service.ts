import { MyBrowser } from "../libs/browser";
import { fork, ChildProcess } from "child_process";
import { ipcMain } from "electron";
import * as path from "path";

interface InfoBody {
  source: string;
  order: string;
  loop: number;
  ips: number;
  debug: boolean;
  isJs: boolean;
}

export class SimuService {
  child: ChildProcess = null; // 全局模拟子进程模块
  browser: MyBrowser; //浏览器常用工具
  proxy_url: string; //代理地址
  isFind: boolean; // 是否寻找到目标
  resultTitle: string; // 寻找的的目标网页百度搜索结果title
  body: InfoBody;
  count = 0; // 执行进度，0为第一个任务
  isStart = false;
  message = "开始执行";

  constructor() {
    // this.body = body;
    this.init();
  }

  init = () => {
    ipcMain.on("start-simu", (e, data: InfoBody) => {
      console.log(`开始模拟`, data);
      if (data && data.source && data.order) {
        this.body = data;
      }
      const result = this.start();
      e.sender.send("response-msg", result);
    });

    ipcMain.on("stop-simu", (e, data) => {
      console.log(`停止模拟`, data);
      const result = this.stop();
      e.sender.send("response-msg", result);
    });
  };

  stop = () => {
    if (this.child) {
      console.log(`已执行杀死子进程`);
      this.over();
      return {
        code: 200,
        type: 1,
        msg: "已执行停止",
      };
    } else {
      return {
        code: 200,
        type: 2,
        msg: "未有任务在执行",
      };
    }
  };

  start = (): any => {
    if (!this.body.source) {
      return {
        code: 201,
        type: 2,
        msg: `没有执行目标`,
      };
    }
    if (this.isStart) {
      return {
        code: 200,

        type: 0,
        msg: `正在执行第${this.count + 1}个任务`,
        data: {
          count: this.count,
        },
      };
    } else {
      console.log(`存储执行状态`);
      this.isStart = true;
      this.child = fork(path.resolve(__dirname, "../libs/simuLibs.js"));
      this.child.on("message", (msg) => {
        console.log("Message from child", msg);
        if (msg.counter) {
          if (this.count > this.body.ips) {
            this.over();
          }
          this.count++;
        } else if (msg.msg) {
          this.over();
          this.message = msg.msg;
        }
      });
      this.child.send({
        type: "start",
        data: this.body,
      });

      return {
        code: 200,
        type: 1,
        msg: this.message,
        data: {
          count: this.count,
        },
      };
    }
  };

  over = () => {
    console.log(`结束子进程`);

    this.count = 0;
    this.isStart = false;

    if (this.child) {
      this.child.send({
        type: "stop",
      });
      this.child.kill();
      this.child = null;
    }
  };
}
