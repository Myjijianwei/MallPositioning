import { PageContainer } from '@ant-design/pro-components';
import React from 'react';
import { HeartOutlined, SafetyOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Row, Col, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const WelcomePage: React.FC = () => {
  return (
    <PageContainer
      title="Safe Guardian"
      contentStyle={{ padding: '32px 64px', backgroundColor: '#f0f2f5' }}
    >
      {/* 主欢迎区域 */}
      <Card
        bordered={false}
        style={{ marginBottom: 32, background: 'linear-gradient(135deg, #1890ff, #0050b3)' }}
      >
        <div style={{ padding: 48, textAlign: 'center', color: '#fff' }}>
          <Title style={{ fontSize: 48, fontWeight: 600, marginBottom: 24, color: '#fff' }}>
            欢迎来到 Safe Guardian 🌟
          </Title>
          <Paragraph style={{ fontSize: 18, marginBottom: 32, color: '#fff' }}>
            实时守护老人与儿童的安全，让关爱无处不在
          </Paragraph>
          <Button
            size="large"
            style={{ marginRight: 16, backgroundColor: '#fff', color: '#1890ff' }}
            href="/device/bind"
          >
            绑定设备
          </Button>
          <Button size="large" href="/monitor/live/:deviceId" style={{ backgroundColor: '#fff', color: '#1890ff' }}>
            实时监控
          </Button>
        </div>
      </Card>

      {/* 核心功能区域 */}
      <Row gutter={[32, 32]} style={{ marginBottom: 48 }}>
        <Col span={8}>
          <Card
            bordered
            title="实时定位"
            // @ts-ignore
            icon={<SafetyOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
          >
            <Paragraph>
              通过 GPS 和 WIFI 定位技术，实时追踪老人与儿童的位置，确保安全无忧。
            </Paragraph>
            <Button type="link" href="/monitor/live/:deviceId">
              查看实时位置
            </Button>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            bordered
            title="历史轨迹"
            // @ts-ignore
            icon={<TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
          >
            <Paragraph>
              记录并展示老人与儿童的历史活动轨迹，帮助您了解他们的日常活动范围。
            </Paragraph>
            <Button type="link" href="/history/track/:deviceId">
              查看历史轨迹
            </Button>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            bordered
            title="电子围栏"
            // @ts-ignore
            icon={<HeartOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
          >
            <Paragraph>
              设置安全区域，当老人或儿童离开指定范围时，系统将自动发送警报。
            </Paragraph>
            <Button type="link" href="/fence">
              设置电子围栏
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 统计信息区域 */}
      <Divider style={{ margin: '48px 0' }} />
      <Row gutter={[24, 24]}>
        <Col span={6}>
          <Card bordered={false} title="已绑定设备">
            <Title style={{ fontSize: 28, fontWeight: 600, color: '#1890ff' }}>
              1,234+
            </Title>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} title="注册用户">
            <Title style={{ fontSize: 28, fontWeight: 600, color: '#1890ff' }}>
              56,789+
            </Title>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} title="每日定位次数">
            <Title style={{ fontSize: 28, fontWeight: 600, color: '#1890ff' }}>
              1M+
            </Title>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} title="成功警报">
            <Title style={{ fontSize: 28, fontWeight: 600, color: '#1890ff' }}>
              120+
            </Title>
          </Card>
        </Col>
      </Row>

      {/* 用户评价区域 */}
      <Divider style={{ margin: '48px 0' }} />
      <Card bordered={false} style={{ textAlign: 'center' }}>
        <Title level={2} style={{ marginBottom: 24 }}>
          用户评价
        </Title>
        <Row gutter={[32, 32]}>
          <Col span={8}>
            <Card bordered>
              <Paragraph>
                “Safe Guardian 让我可以随时了解老人的位置，非常安心！”
              </Paragraph>
              <Paragraph strong>- 张女士</Paragraph>
            </Card>
          </Col>
          <Col span={8}>
            <Card bordered>
              <Paragraph>
                “孩子的安全是我们最关心的，这个平台帮了大忙！”
              </Paragraph>
              <Paragraph strong>- 李先生</Paragraph>
            </Card>
          </Col>
          <Col span={8}>
            <Card bordered>
              <Paragraph>
                “操作简单，功能强大，推荐给所有有需要的家庭。”
              </Paragraph>
              <Paragraph strong>- 王先生</Paragraph>
            </Card>
          </Col>
        </Row>
      </Card>
    </PageContainer>
  );
};

export default WelcomePage;
