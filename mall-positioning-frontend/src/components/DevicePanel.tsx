import React from 'react';
import { Card, Select, Button, Typography, Space } from 'antd';

const { Text } = Typography;
const { Option } = Select;

interface DevicePanelProps {
  devices: any[];
  selectedDevice: string | null;
  onSelectDevice: (id: string) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
  connectionStatus: string;
}

const DevicePanel: React.FC<DevicePanelProps> = ({
                                                   devices,
                                                   selectedDevice,
                                                   onSelectDevice,
                                                   showAll,
                                                   onToggleShowAll,
                                                   connectionStatus
                                                 }) => {
  return (
    <Card title="设备控制" bordered={false}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text type="secondary">连接状态: </Text>
          <Text strong style={{ color: connectionStatus === 'connected' ? '#52c41a' : '#f5222d' }}>
            {connectionStatus === 'connected' ? '已连接' : '已断开'}
          </Text>
        </div>

        <Select
          placeholder="选择设备"
          style={{ width: '100%' }}
          value={selectedDevice}
          onChange={onSelectDevice}
        >
          {devices.map(device => (
            <Option key={device.id} value={device.id}>
              {device.name}
            </Option>
          ))}
        </Select>

        <Button
          type={showAll ? 'default' : 'primary'}
          onClick={onToggleShowAll}
          block
        >
          {showAll ? '聚焦选中设备' : '显示所有设备'}
        </Button>

        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {devices.map(device => (
            <div key={device.id} style={{
              padding: 8,
              background: selectedDevice === device.id ? '#e6f7ff' : 'transparent'
            }}>
              <Text strong>{device.name}</Text>
              {device.position && (
                <Text type="secondary" style={{ display: 'block' }}>
                  {device.position.longitude.toFixed(6)}, {device.position.latitude.toFixed(6)}
                </Text>
              )}
            </div>
          ))}
        </div>
      </Space>
    </Card>
  );
};

export default DevicePanel;
