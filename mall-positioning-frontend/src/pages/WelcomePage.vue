<template>
  <a-page-container
    title="Safe Guardian"
    :content-style="{ padding: '32px 64px', backgroundColor: '#f0f2f5' }"
  >
    <!-- 主欢迎区域 -->
    <a-card
      :bordered="false"
      :style="{
        marginBottom: '32px',
        background: 'linear-gradient(135deg, #1890ff, #0050b3)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
        transform: 'translateY(0)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
        }
      }"
    >
      <div :style="{ padding: '48px', textAlign: 'center', color: '#fff' }">
        <a-typography-title
          :style="{
            fontSize: '48px',
            fontWeight: 600,
            marginBottom: '24px',
            color: '#fff',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)'
          }"
        >
          欢迎来到 Safe Guardian 🌟
        </a-typography-title>
        <a-typography-paragraph :style="{ fontSize: '18px', marginBottom: '32px', color: '#fff' }">
          实时守护老人与儿童的安全，让关爱无处不在
        </a-typography-paragraph>
        <a-button
          size="large"
          :style="{
            marginRight: '16px',
            backgroundColor: '#fff',
            color: '#1890ff',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              backgroundColor: '#e6f7ff',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }
          }"
          href="/device/bind"
        >
          绑定设备
        </a-button>
        <a-button
          size="large"
          :style="{
            backgroundColor: '#fff',
            color: '#1890ff',
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              backgroundColor: '#e6f7ff',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }
          }"
          href="/monitor/live/:deviceId"
        >
          实时监控
        </a-button>
      </div>
    </a-card>

    <!-- 核心功能区域 -->
    <a-row :gutter="[32, 32]" :style="{ marginBottom: '48px' }">
      <a-col :span="8">
        <a-card
          bordered
          title="实时定位"
          :style="{
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
            }
          }"
        >
          <template #extra>
            <safety-outlined :style="{ fontSize: '24px', color: '#1890ff' }" />
          </template>
          <a-typography-paragraph>
            通过 GPS 和 WIFI 定位技术，实时追踪老人与儿童的位置，确保安全无忧。
          </a-typography-paragraph>
          <a-button type="link" href="/monitor">
            查看实时位置
          </a-button>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card
          bordered
          title="历史轨迹"
          :style="{
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
            }
          }"
        >
          <template #extra>
            <team-outlined :style="{ fontSize: '24px', color: '#1890ff' }" />
          </template>
          <a-typography-paragraph>
            记录并展示老人与儿童的历史活动轨迹，帮助您了解他们的日常活动范围。
          </a-typography-paragraph>
          <a-button type="link" href="/history">
            查看历史轨迹
          </a-button>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card
          bordered
          title="电子围栏"
          :style="{
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
            }
          }"
        >
          <template #extra>
            <heart-outlined :style="{ fontSize: '24px', color: '#1890ff' }" />
          </template>
          <a-typography-paragraph>
            设置安全区域，当老人或儿童离开指定范围时，系统将自动发送警报。
          </a-typography-paragraph>
          <a-button type="link" href="/geo-fence">
            设置电子围栏
          </a-button>
        </a-card>
      </a-col>
    </a-row>

    <!-- 统计信息区域 -->
    <a-divider :style="{ margin: '48px 0' }" />
    <a-row :gutter="[24, 24]">
      <a-col :span="6">
        <a-card :bordered="false" title="已绑定设备">
          <a-typography-title :style="{ fontSize: '28px', fontWeight: 600, color: '#1890ff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }">
            1,234+
          </a-typography-title>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :bordered="false" title="注册用户">
          <a-typography-title :style="{ fontSize: '28px', fontWeight: 600, color: '#1890ff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }">
            56,789+
          </a-typography-title>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :bordered="false" title="每日定位次数">
          <a-typography-title :style="{ fontSize: '28px', fontWeight: 600, color: '#1890ff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }">
            1M+
          </a-typography-title>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card :bordered="false" title="成功警报">
          <a-typography-title :style="{ fontSize: '28px', fontWeight: 600, color: '#1890ff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }">
            120+
          </a-typography-title>
        </a-card>
      </a-col>
    </a-row>

    <!-- 用户评价区域 -->
    <a-divider :style="{ margin: '48px 0' }" />
    <a-card :bordered="false" :style="{ textAlign: 'center' }">
      <a-typography-title :level="2" :style="{ marginBottom: '24px' }">
        用户评价
      </a-typography-title>
      <a-row :gutter="[32, 32]">
        <a-col :span="8">
          <a-card bordered>
            <a-typography-paragraph>
              “Safe Guardian 让我可以随时了解老人的位置，非常安心！”
            </a-typography-paragraph>
            <a-typography-paragraph strong>
              - 张女士
            </a-typography-paragraph>
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card bordered>
            <a-typography-paragraph>
              “孩子的安全是我们最关心的，这个平台帮了大忙！”
            </a-typography-paragraph>
            <a-typography-paragraph strong>
              - 李先生
            </a-typography-paragraph>
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card bordered>
            <a-typography-paragraph>
              “操作简单，功能强大，推荐给所有有需要的家庭。”
            </a-typography-paragraph>
            <a-typography-paragraph strong>
              - 王先生
            </a-typography-paragraph>
          </a-card>
        </a-col>
      </a-row>
    </a-card>
  </a-page-container>
</template>

<script lang="ts" setup>
import { PageContainer as APageContainer } from '@ant-design-vue/pro-layout';
import { SafetyOutlined, TeamOutlined, HeartOutlined } from '@ant-design/icons-vue';
import { Typography } from 'ant-design-vue';

const { Title: ATypographyTitle, Paragraph: ATypographyParagraph } = Typography;
</script>

<style scoped>
/* 你可以在这里添加一些自定义样式 */
a-card {
  transition: all 0.3s ease;
}
</style>
