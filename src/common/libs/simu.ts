process.on('message', msg => {
  console.log('Message from parent:', msg);

  new Simu();
});

/**
 * 通过子进程开启模拟
 *
 */

class Simu {
  counter = 0;
  constructor() {
    this.init();
  }

  init() {
    console.log(`我初始化了`);
  }

  timer() {
    setInterval(() => {
      process.send({ counter: this.counter++ });
    }, 3000);
  }

  stop() {
    console.log(`我开始停止了`);
  }
}
