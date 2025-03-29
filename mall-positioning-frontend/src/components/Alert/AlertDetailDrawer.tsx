import React from 'react';
import { Drawer, Descriptions, Tag, Button, Space, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getStatusByCode, getAlertTypeText } from '@/constants/alerts';

interface AlertDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  alert: any;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const AlertDetailDrawer: React.FC<AlertDetailDrawerProps> = ({
                                                               visible,
                                                               onClose,
                                                               alert,
                                                               onStatusChange,
                                                               onDelete
                                                             }) => {
  if (!alert) return null;

  return (
    <Drawer
      title="警报详情"
      width={600}
      onClose={onClose}
      visible={visible}
      extra={
        <Space>
          {alert.status !== 'RESOLVED' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => onStatusChange(alert.id, 'RESOLVED').then(onClose)}
            >
              标记为已解决
            </Button>
          )}
          {alert.status !== 'IGNORED' && (
            <Button
              icon={<CloseCircleOutlined />}
              onClick={() => onStatusChange(alert.id, 'IGNORED').then(onClose)}
            >
              标记为已忽略
            </Button>
          )}
          <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(alert.id).then(onClose)}>
            删除记录
          </Button>
        </Space>
      }
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="警报类型">
          <Tag
            color={alert.level === 'HIGH' ? 'red' : alert.level === 'MEDIUM' ? 'orange' : 'blue'}
          >
            {getAlertTypeText(alert.type)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="警报状态">
          <Tag color={getStatusByCode(alert.status).color}>
            {getStatusByCode(alert.status).text}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="设备名称">{alert.deviceName}</Descriptions.Item>
        <Descriptions.Item label="围栏名称">{alert.fenceName}</Descriptions.Item>
        <Descriptions.Item label="触发时间">
          {dayjs(alert.triggeredAt).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="位置信息">
          {alert.latitude && alert.longitude ? (
            <a
              href={`https://www.amap.com/?q=${alert.latitude},${alert.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {alert.latitude}, {alert.longitude}
            </a>
          ) : (
            '未知位置'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="详细信息">{alert.message}</Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
};

export default AlertDetailDrawer;
