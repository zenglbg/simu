import React from "react";
import { HomePage } from "./components/index/home";
import "antd/dist/antd.css"; // or 'antd/dist/antd.less'
import zhCN from "antd/es/locale/zh_CN";
import { ConfigProvider } from "antd";

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <HomePage />
    </ConfigProvider>
  );
};

export default App;
