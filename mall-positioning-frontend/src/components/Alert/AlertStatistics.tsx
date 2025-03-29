import React from 'react';
import { Pie, Column } from '@ant-design/plots';
import { ProCard } from '@ant-design/pro-components';
import { AlertStatus, AlertType, AlertLevel } from '@/constants/alerts';

interface AlertStatisticsProps {
  alerts?: any[];
}

const AlertStatistics: React.FC<AlertStatisticsProps> = ({ alerts = [] }) => {
  // 安全处理数据
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  // 状态分布数据
  const statusData = Object.values(AlertStatus).map(status => ({
    type: status.text,
    value: safeAlerts.filter(a => String(a.status) === String(status.code)).length,
    color: status.color
  }));

  // 类型分布数据
  const typeData = Object.entries(AlertType).map(([key, value]) => ({
    type: value,
    value: safeAlerts.filter(a => a.type === key).length
  }));

  // 级别分布数据
  const levelData = Object.entries(AlertLevel).map(([key, value]) => ({
    type: value,
    value: safeAlerts.filter(a => a.level === key).length
  }));

  // 状态饼图配置
  const statusConfig = {
    data: statusData,
    angleField: 'value',
    colorField: 'type',
    color: ({ type }: { type: string }) => {
      const item = statusData.find(d => d.type === type);
      return item ? item.color : '#999';
    },
    radius: 0.8,
    label: {
      type: 'inner', // 修改为inner避免outer报错
      content: '{percentage}',
    },
    interactions: [{ type: 'element-active' }],
  };

  // 柱状图通用配置
  const columnConfig = {
    xField: 'type',
    yField: 'value',
    label: {
      position: 'top', // 修改为top避免middle报错
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
  };

  return (
    <ProCard title="警报统计" headerBordered gutter={16}>
      <ProCard colSpan={8}>
        <h3>状态分布</h3>
        {statusData.some(item => item.value > 0) ? (
          <Pie {...statusConfig} />
        ) : (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            暂无数据
          </div>
        )}
      </ProCard>
      <ProCard colSpan={8}>
        <h3>类型分布</h3>
        {typeData.some(item => item.value > 0) ? (
          <Column {...columnConfig} data={typeData} />
        ) : (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            暂无数据
          </div>
        )}
      </ProCard>
      <ProCard colSpan={8}>
        <h3>级别分布</h3>
        {levelData.some(item => item.value > 0) ? (
          <Column
            {...columnConfig}
            data={levelData}
            color={({ type }) =>
              type === '高' ? '#ff4d4f' :
                type === '中' ? '#faad14' :
                  '#52c41a'
            }
          />
        ) : (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            暂无数据
          </div>
        )}
      </ProCard>
    </ProCard>
  );
};

export default AlertStatistics;
