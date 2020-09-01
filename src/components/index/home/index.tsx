import "./home.scss";
import React, { useState, useEffect } from "react";
import { Form, Input, InputNumber, Button, Radio, message } from "antd";
import Layout from "../../Layout";
import { ipcRenderer as ipc } from "electron";

interface Props {}

interface DataInter {
  isJs: boolean;
  debug: boolean;
  source: string;
  order: string;
  loop: number;
  ips: number;
}

export const HomePage = (props: Props) => {
  const [isJs, setIsJs] = useState(true);
  const [debug, setDebug] = useState(true);
  const [source, setSource] = useState("www.cn-hdfh.com/");
  const [order, setOrder] = useState("909894887329961");
  const [loop, setLoop] = useState(10);
  const [ips, setIps] = useState(3);

  useEffect(() => {
    init();
  }, []);

  const init = () => {
    ipc.on("response-msg", (event, { type, msg }) => {
      switch (type) {
        case 0:
          message.error(msg);
          break;
        case 1:
          message.success(msg);
          break;
        default:
          message.info(msg);
          break;
      }
    });
  };

  const handleStop = () => {
    ipc.send("stop-simu");
  };

  const onFinish = (values: DataInter) => {
    console.log("Failed:", values);

    if (source) {
      ipc.send("start-simu", values);
    } else {
      message.error("目标网址不能为空！");
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };
  return (
    <Layout>
      <Form
        style={{
          padding: "30px",
        }}
        layout="horizontal"
        onFinish={onFinish}
        initialValues={{ isJs, debug, source, order, loop, ips }}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          name="source"
          label="目标网址"
          rules={[{ required: true, message: `模拟目标不能为空` }]}
        >
          <Input
            style={{ width: 280 }}
            defaultValue={source}
            value={source}
            placeholder="请输入百度快照显示网址"
            onChange={(e) => setSource(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          name="order"
          label="快代理订单号"
          rules={[{ required: true, message: `快代理订单号不能为空` }]}
        >
          <Input
            style={{ width: 280 }}
            defaultValue={order}
            value={order}
            placeholder="请输入代理订单编号--目前使用快代理"
            onChange={(e) => setOrder(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          name="loop"
          label="百度搜索深度"
          rules={[{ type: "number", min: 0, max: 100000 }]}
        >
          <InputNumber
            min={0}
            max={100000}
            defaultValue={loop}
            value={loop}
            placeholder="请输入数字，对百度搜索结果翻页查找的最大翻页数"
            onChange={(value) => setLoop(Number(value))}
          />
        </Form.Item>

        <Form.Item
          name="ips"
          label="循环次数"
          rules={[{ type: "number", min: 0, max: 100000 }]}
        >
          <InputNumber
            min={0}
            max={100000}
            defaultValue={ips}
            value={ips}
            onChange={(value) => setIps(Number(value))}
          />
        </Form.Item>

        <Form.Item label="debug" name="debug">
          <Radio.Group
            defaultValue={debug}
            onChange={(e) => setDebug(e.target.value)}
            value={debug}
          >
            <Radio value={false}>false</Radio>
            <Radio value={true}>true</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="js" name="isJs">
          <Radio.Group
            defaultValue={isJs}
            onChange={(e) => setIsJs(e.target.value)}
            value={isJs}
          >
            <Radio value={false}>false</Radio>
            <Radio value={true}>true</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item>
          <Button htmlType="submit" className="btn-start" type="primary">
            开始执行
          </Button>
          <Button
            onClick={handleStop}
            className="btn-stop"
            style={{ marginLeft: 8 }}
          >
            停止执行
          </Button>
        </Form.Item>
      </Form>
    </Layout>
  );
};
