import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Typography, Space, Select, Button, message, Spin } from 'antd';
import styled from 'styled-components';
import StableAMap from '@/components/StableAMap';
import { useStableWebSocket } from '@/hooks/useStableWebSocket';
import { getWardByGidUsingPost } from '@/services/MapBackend/userController';
import { useModel } from 'umi';

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
  const { initialState } = useModel('@@initialState');
  const { loginUser } = initialState || {};

  const [devices, setDevices] = useState<Record<string, any>>({});
  const [deviceList, setDeviceList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [showAll, setShowAll] = useState(true);
  const [currentPos, setCurrentPos] = useState<{ longitude: number; latitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWardByGidUsingPost({ guardianId: loginUser?.id });
      if (res.code === 0 && res.data) {
        const formattedDevices = res.data.map((d: any) => ({
          id: d.deviceId?.toString() || '',
          name: d.deviceName || `设备 ${d.deviceId}`,
        })).filter(device => device.id);

        setDeviceList(formattedDevices);

        // 更新现有设备名称
        setDevices(prev => {
          const updated = {...prev};
          formattedDevices.forEach((d: any) => {
            if (updated[d.id]) {
              updated[d.id].name = d.name;
            }
          });
          return updated;
        });

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
  }, [selectedDevice, loginUser?.id]);

  const handleWebSocketMessage = useCallback((data: any) => {
    if (!data?.deviceId) return;

    if (data.error) {
      message.error(`设备${data.deviceId}连接错误: ${data.error}`);
      return;
    }

    const deviceName = deviceList.find(d => d.id === data.deviceId)?.name;

    setDevices((prev) => ({
      ...prev,
      [data.deviceId]: {
        ...data,
        name: deviceName || `设备 ${data.deviceId}`,
        timestamp: Date.now(),
      },
    }));
  }, [deviceList]);

  const wsUrl = useMemo(() => {
    if (!selectedDevice || !loginUser?.id) return null;
    try {
      const url = new URL('ws://localhost:8001/api/gps-websocket');
      url.searchParams.set('wardId', loginUser.id.toString());
      url.searchParams.set('deviceId', selectedDevice);
      return url.toString();
    } catch (e) {
      console.error('构建URL失败:', e);
      return null;
    }
  }, [selectedDevice, loginUser?.id]);

  const wsOptions = useMemo(() => ({
    onMessage: handleWebSocketMessage,
    heartbeatInterval: 30000,
    onError: (error: Event) => {
      console.error('WebSocket错误:', error);
      message.error('连接发生错误');
    },
    onReconnect: (attempt: number) => {
      console.log(`第${attempt}次重连...`);
      if (attempt >= 5) {
        message.warning('连接已断开，请检查网络后刷新页面');
      }
    }
  }), [handleWebSocketMessage]);

  const { status, reconnect, close } = useStableWebSocket(wsUrl, wsOptions);

  const handleDeviceChange = useCallback(async (deviceId: string) => {
    setIsSwitching(true);
    try {
      close(1000, '设备切换');
      await new Promise(resolve => setTimeout(resolve, 300));
      setSelectedDevice(deviceId);
    } finally {
      setIsSwitching(false);
    }
  }, [close]);

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

  useEffect(() => {
    const init = async () => {
      await fetchDevices();
      if (selectedDevice) {
        reconnect();
      }
    };
    init();
  }, []);

  const displayDevices = Object.values(devices).filter((d) =>
    showAll || d.deviceId === selectedDevice
  );

  return (
    <PageContainer
      title="实时位置监控"
      breadcrumb={{
        // @ts-ignore
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
          onClick={fetchDevices}
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
      <Spin spinning={loading || isSwitching} tip={isSwitching ? '设备切换中...' : '加载中...'}>
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
                onChange={handleDeviceChange}
                value={selectedDevice || undefined}
                showSearch
                optionFilterProp="children"
                loading={loading || isSwitching}
                disabled={loading || isSwitching || deviceList.length === 0}
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
                disabled={!selectedDevice || isSwitching}
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
                        onClick={() => handleDeviceChange(device.id)}
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
