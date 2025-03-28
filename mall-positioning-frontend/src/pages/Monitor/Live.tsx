import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Typography, Space, Select, Button, message, Spin, Alert, Tag, Divider, Switch } from 'antd';
import styled from 'styled-components';
import StableAMap from '@/components/StableAMap';
import { useStableWebSocket } from '@/hooks/useStableWebSocket';
import { getWardByGidUsingPost } from '@/services/MapBackend/userController';
import { useModel } from 'umi';
import { listFencesUsingGet } from '@/services/MapBackend/geoFenceController';
import dayjs from 'dayjs';
import { useRequest } from 'ahooks';

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
  const [loading, setLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showFences, setShowFences] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用 useRequest 管理围栏数据
  const {
    data: fences = [],
    run: loadFences,
    loading: fencesLoading,
    error: fencesError
  } = useRequest(
    async (deviceId?: string) => {
      if (!deviceId) return [];
      try {
        const res = await listFencesUsingGet({ deviceId });
        if (res.code === 0 && res.data) {
          return res.data.map(f => ({
            ...f,
            coordinates: Array.isArray(f.coordinates) ? f.coordinates : JSON.parse(f.coordinates || '[]')
          }));
        }
        throw new Error(res.message || '获取围栏数据失败');
      } catch (err) {
        console.error('获取围栏数据失败:', err);
        throw err;
      }
    },
    {
      manual: true,
      onError: (err) => {
        message.error('获取围栏数据失败');
        setError('获取围栏数据失败，请检查网络连接或API配置');
      }
    }
  );

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWardByGidUsingPost({ guardianId: loginUser?.id });
      if (res.code === 0 && res.data) {
        const formattedDevices = res.data.map((d: any) => ({
          id: d.deviceId?.toString() || '',
          name: d.deviceName || `设备 ${d.deviceId}`,
        })).filter(device => device.id);

        setDeviceList(formattedDevices);
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
        throw new Error(res.message || '获取设备列表失败');
      }
    } catch (err) {
      console.error('获取设备列表失败:', err);
      setError('获取设备列表失败，请检查网络连接或API配置');
      message.error('获取设备列表失败');
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, loginUser?.id]);

  // WebSocket 消息处理
  const handleWebSocketMessage = useCallback((data: any) => {
    console.log('收到WebSocket消息:', data);
    if (!data?.deviceId) return;

    if (data.error) {
      setError(`设备${data.deviceId}连接错误: ${data.error}`);
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

  // WebSocket URL 构建 - 使用固定的localhost地址
  const wsUrl = useMemo(() => {
    if (!selectedDevice || !loginUser?.id) return null;
    try {
      const url = new URL('ws://localhost:8001/api/gps-websocket');
      url.searchParams.set('wardId', loginUser.id.toString());
      url.searchParams.set('deviceId', selectedDevice);
      console.log('WebSocket URL:', url.toString());
      return url.toString();
    } catch (e) {
      console.error('构建URL失败:', e);
      setError('构建WebSocket连接失败');
      return null;
    }
  }, [selectedDevice, loginUser?.id]);

  // WebSocket 配置
  const wsOptions = useMemo(() => ({
    onMessage: handleWebSocketMessage,
    heartbeatInterval: 30000,
    onError: (error: Event) => {
      console.error('WebSocket错误:', error);
      setError('WebSocket连接发生错误');
      message.error('连接发生错误');
    },
    onReconnect: (attempt: number) => {
      console.log(`第${attempt}次重连...`);
      if (attempt >= 5) {
        setError('WebSocket连接已断开，请检查网络后刷新页面');
        message.warning('连接已断开，请检查网络后刷新页面');
      }
    },
    onOpen: () => {
      console.log('WebSocket连接已建立');
      setError(null);
    },
    onClose: () => {
      console.log('WebSocket连接关闭');
    }
  }), [handleWebSocketMessage]);

  // 使用自定义hook管理WebSocket连接
  const { status, reconnect, close } = useStableWebSocket(wsUrl, wsOptions);

  // 设备切换处理
  const handleDeviceChange = useCallback(async (deviceId: string) => {
    setIsSwitching(true);
    setError(null);
    try {
      // 关闭当前连接
      close(1000, '设备切换');
      // 等待短暂时间确保连接关闭
      await new Promise(resolve => setTimeout(resolve, 300));
      // 更新选中设备
      setSelectedDevice(deviceId);
      // 加载新设备的围栏数据
      loadFences(deviceId);
      // 重新连接WebSocket
      reconnect();
    } catch (err) {
      console.error('设备切换失败:', err);
      setError('设备切换失败');
      message.error('设备切换失败');
    } finally {
      setIsSwitching(false);
    }
  }, [close, loadFences, reconnect]);

  // 格式化围栏数据
  const formattedFences = useMemo(() => {
    if (!showFences) return [];

    return fences.map(fence => ({
      id: fence.id!,
      name: fence.name || '未命名围栏',
      coordinates: fence.coordinates as [number, number][],
      color: fence.color || '#1890ff'
    }));
  }, [fences, showFences]);

  // 初始化
  useEffect(() => {
    const init = async () => {
      try {
        await fetchDevices();
        if (selectedDevice) {
          await loadFences(selectedDevice);
          reconnect();
        }
      } catch (err) {
        console.error('初始化失败:', err);
        setError('初始化失败，请刷新页面重试');
      }
    };
    init();

    // 组件卸载时关闭WebSocket连接
    return () => {
      close(1000, '组件卸载');
    };
  }, []);

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
          {status === 'connecting' && ' (连接中...)'}
        </span>,
      ]}
    >
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading || isSwitching || fencesLoading} tip={isSwitching ? '设备切换中...' : '加载中...'}>
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 180px)' }}>
          <div style={{ flex: 1 }}>
            <StableAMap
              devices={displayDevices}
              fences={formattedFences}
              center={selectedDevice && devices[selectedDevice] ? devices[selectedDevice] : undefined}
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

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text strong>显示围栏</Text>
                <Switch
                  checked={showFences}
                  onChange={setShowFences}
                  loading={fencesLoading}
                />
              </div>

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
                            {dayjs(data.timestamp).format('HH:mm:ss')} -
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

              <Divider />

              <Text strong>围栏统计</Text>
              <div style={{ padding: 8 }}>
                <Text>总围栏数: <Tag color="purple">{fences.length}</Tag></Text>
                <Text>显示中: <Tag color="green">{showFences ? fences.length : 0}</Tag></Text>
              </div>

              <Divider />

              <Text strong>连接信息</Text>
              <div style={{ padding: 8 }}>
                <Text>状态: <Tag color={status === 'connected' ? 'success' : 'error'}>{status}</Tag></Text>
                <Text>服务端: <Tag>ws://localhost:8001</Tag></Text>
              </div>
            </Space>
          </MonitorCard>
        </div>
      </Spin>
    </PageContainer>
  );
};

export default LiveMonitor;
