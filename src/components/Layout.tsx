import React, { ReactElement, ComponentProps } from "react";
import { Layout } from "antd";

const { Header, Content } = Layout;
interface Props {}

export default function myLayout({
  children,
}: Props & ComponentProps<any>): ReactElement {
  return (
    <Layout
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <Header>Header</Header>
      <Content style={{ overflow: "scroll" }}>{children}</Content>
    </Layout>
  );
}
