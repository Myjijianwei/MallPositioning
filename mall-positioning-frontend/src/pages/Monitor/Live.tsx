import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Typography, Space, Select, Button, message, Spin } from 'antd';
import styled from 'styled-components';
import StableAMap from '@/components/StableAMap';
import { useStableWebSocket } from '@/hooks/useStableWebSocket';
import { getWardByGidUsingPost } from '@/services/MapBackend/userController';

const { Text } = Typography;
const { Option } = Select;

const MonitorCard = styled(Card)`
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
`;

const LiveMonitor = () => {
  const [devices, setDevices] = useState<Record<string, any>>({});
  const [deviceList, setDeviceList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [showAll, setShowAll] = useState(true);
  const [currentPos, setCurrentPos] = useState<{ longitude: number; latitude: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取设备列表
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWardByGidUsingPost({ guardianId: 5 });
      if (res.code === 0 && res.data) {
        const formattedDevices = res.data.map((d: any) => ({
          id: d.deviceId?.toString() || '',
          name: d.deviceName || `设备 ${d.deviceId}`,
        })).filter(device => device.id);

        setDeviceList(formattedDevices);

        // 自动选择第一个有效设备
        if (formattedDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(formattedDevices[0].id);
        }
      } else {
        message.error(res.message || '获取设备列表失败');
      }
    } catch (err) {
      console.error('获取设备列表失败:', err);
      message.error('获取设备列表失败');
    } finally {
      setLoading(false);
    }
  }, [selectedDevice]);

  // WebSocket处理
  const handleWebSocketMessage = useCallback((data: any) => {
    if (!data?.deviceId) return;

    if (data.error) {
      message.error(`设备${data.deviceId}连接错误: ${data.error}`);
      return;
    }

    setDevices((prev) => ({
      ...prev,
      [data.deviceId]: {
        ...data,
        timestamp: Date.now(),
      },
    }));
  }, []);

  const { status, reconnect } = useStableWebSocket(
    selectedDevice
      ? `ws://localhost:8001/api/gps-websocket?guardianId=5&deviceId=${encodeURIComponent(selectedDevice)}`
      : null,
    {
      onMessage: handleWebSocketMessage,
      onReconnect: (attempt) => {
        console.log(`正在第${attempt}次重连...`);
      }
    }
  );

  // 获取当前位置
  const handleLocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentPos({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
          });
          message.success('位置获取成功');
        },
        (err) => message.error(`定位失败: ${err.message}`),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      message.error('您的浏览器不支持地理位置功能');
    }
  }, []);

  // 手动刷新设备列表
  const handleRefreshDevices = useCallback(() => {
    fetchDevices();
  }, [fetchDevices]);

  // 初始化加载设备列表
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // 设备选择变化时重新连接
  useEffect(() => {
    if (selectedDevice) {
      reconnect();
    }
  }, [selectedDevice, reconnect]);

  // 准备显示的数据
  const displayDevices = Object.values(devices).filter((d) =>
    showAll || d.deviceId === selectedDevice
  );

  return (
    <PageContainer
      title="实时位置监控"
      breadcrumb={{
        items: [
          { title: '首页', path: '/' },
          { title: '实时监控' },
        ],
      }}
      extra={[
        <Button key="locate" type="primary" onClick={handleLocate}>
          获取我的位置
        </Button>,
        <Button
          key="refresh"
          type="default"
          onClick={handleRefreshDevices}
          loading={loading}
        >
          刷新设备列表
        </Button>,
        <span
          key="status"
          style={{
            marginLeft: 16,
            color: status === 'connected' ? '#52c41a' : '#f5222d',
          }}
        >
          {status === 'connected' ? '● 已连接' : '● 连接断开'}
        </span>,
      ]}
    >
      <Spin spinning={loading} tip="加载中...">
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 180px)' }}>
          <div style={{ flex: 1 }}>
            <StableAMap
              devices={displayDevices}
              center={selectedDevice && devices[selectedDevice] ? devices[selectedDevice] : currentPos}
            />
          </div>

          <MonitorCard style={{ width: 300 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>设备控制 ({Object.keys(devices).length}台在线)</Text>

              <Select
                placeholder={loading ? "加载设备中..." : "选择设备"}
                style={{ width: '100%' }}
                onChange={(value) => setSelectedDevice(value as string)}
                value={selectedDevice || undefined}
                showSearch
                optionFilterProp="children"
                loading={loading}
                disabled={loading || deviceList.length === 0}
              >
                {deviceList.map((device) => (
                  <Option
                    key={`device-${device.id}`}
                    value={device.id}
                    disabled={!devices[device.id]}
                  >
                    <span
                      style={{
                        color: devices[device.id] ? '#52c41a' : '#f5222d',
                      }}
                    >
                      {device.name}
                    </span>
                  </Option>
                ))}
              </Select>

              <Button
                type={showAll ? 'default' : 'primary'}
                onClick={() => setShowAll(!showAll)}
                block
                disabled={!selectedDevice}
              >
                {showAll ? '聚焦选中设备' : '显示所有设备'}
              </Button>

              {deviceList.length === 0 ? (
                <div style={{ padding: 12, color: '#666', textAlign: 'center' }}>
                  {loading ? '正在加载设备列表...' : '暂无设备数据'}
                </div>
              ) : (
                <div style={{ maxHeight: 300, overflowY: 'auto', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                  {deviceList.map((device) => {
                    const data = devices[device.id];
                    return (
                      <div
                        key={`device-item-${device.id}`}
                        style={{
                          padding: 8,
                          marginBottom: 8,
                          background: selectedDevice === device.id ? '#e6f7ff' : 'transparent',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedDevice(device.id)}
                      >
                        <Text strong>{device.name}</Text>
                        {data ? (
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                            {data.longitude?.toFixed(6) || '未知'}, {data.latitude?.toFixed(6) || '未知'}
                          </Text>
                        ) : (
                          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                            设备离线
                          </Text>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Space>
          </MonitorCard>
        </div>
      </Spin>
    </PageContainer>
  );
};

export default LiveMonitor;
