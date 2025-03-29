import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Typography,
  Space,
  Select,
  Button,
  message,
  Spin,
  Alert,
  Tag,
  Divider,
  Switch,
  notification,
} from 'antd';
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

interface AlertMessage {
  type: string;
  title: string;
  message: string;
  longitude?: number;
  latitude?: number;
  timestamp: string;
  deviceId?: string;
  fenceName?: string;
}

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
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  // 获取所有设备的围栏数据
  const {
    data: allFences = [],
    run: loadAllFences,
    loading: fencesLoading,
    error: fencesError
  } = useRequest(
    async (deviceIds: string[]) => {
      try {
        const results = await Promise.all(
          deviceIds.map(async deviceId => {
            const res = await listFencesUsingGet({ deviceId });
            if (res.code === 0 && res.data) {
              return res.data.map(f => ({
                ...f,
                deviceId,
                coordinates: Array.isArray(f.coordinates) ? f.coordinates : JSON.parse(f.coordinates || '[]')
              }));
            }
            return [];
          })
        );
        return results.flat();
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

  // 按设备ID分组的围栏数据
  const fencesByDevice = useMemo(() => {
    return allFences.reduce((acc, fence) => {
      if (!acc[fence.deviceId]) {
        acc[fence.deviceId] = [];
      }
      acc[fence.deviceId].push(fence);
      return acc;
    }, {} as Record<string, any[]>);
  }, [allFences]);

  // 当前选中设备的围栏
  const currentFences = useMemo(() => {
    return fencesByDevice[selectedDevice] || [];
  }, [selectedDevice, fencesByDevice]);

  // 获取设备列表
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWardByGidUsingPost({ guardianId: loginUser?.id });
      if (res.code === 0 && res.data) {
        const formattedDevices = res.data
          .map((d: any) => ({
            id: d.deviceId?.toString() || '',
            name: d.deviceName || `设备 ${d.deviceId}`,
          }))
          .filter((device: any) => device.id);

        setDeviceList(formattedDevices);

        // 更新设备状态
        setDevices(prev => {
          const updated = {...prev};
          formattedDevices.forEach((d: any) => {
            if (updated[d.id]) {
              updated[d.id].name = d.name;
            }
          });
          return updated;
        });

        // 如果有设备但未选中，选择第一个设备
        if (formattedDevices.length > 0 && !selectedDevice) {
          const firstDevice = formattedDevices[0].id;
          setSelectedDevice(firstDevice);
        }

        // 加载所有设备的围栏数据
        if (formattedDevices.length > 0) {
          loadAllFences(formattedDevices.map((d: any) => d.id));
        }

        return formattedDevices;
      }
      throw new Error(res.message || '获取设备列表失败');
    } catch (err) {
      console.error('获取设备列表失败:', err);
      setError('获取设备列表失败，请检查网络连接或API配置');
      message.error('获取设备列表失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, loginUser?.id, loadAllFences]);

  // WebSocket 消息处理
  const handleWebSocketMessage = useCallback((data: any) => {
    // 处理ALERT类型消息
    if (data.type === 'ALERT' && data.data) {
      const alertData = data.data;

      // 从消息内容中提取设备ID和围栏名称
      const extractDeviceId = (msg: string): string | null => {
        const match = msg.match(/设备([a-f0-9-]{36})/);
        return match ? match[1] : null;
      };

      const deviceId = extractDeviceId(alertData.message) || '';
      const fenceName = alertData.message.split('围栏')[1]?.trim() || '未知围栏';

      const newAlert: AlertMessage = {
        type: alertData.type,
        title: alertData.title,
        message: alertData.message,
        longitude: alertData.longitude,
        latitude: alertData.latitude,
        timestamp: alertData.triggeredAt,
        deviceId,
        fenceName
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 5)]);

      // 显示通知
      notification.warning({
        message: `${alertData.title} (${fenceName})`,
        description: alertData.message,
        placement: 'topRight',
        duration: 5,
      });
    }
    // 处理普通位置消息
    else if (data.latitude !== undefined && data.deviceId) {
      const deviceName = deviceList.find(d => d.id === data.deviceId)?.name;
      setDevices(prev => ({
        ...prev,
        [data.deviceId]: {
          ...data,
          name: deviceName || `设备 ${data.deviceId}`,
          timestamp: Date.now(),
        },
      }));
    }
  }, [deviceList]);

  // WebSocket URL 构建
  const wsUrl = useMemo(() => {
    if (!selectedDevice || !loginUser?.id) return null;
    try {
      const url = new URL('ws://localhost:8001/api/gps-websocket');
      url.searchParams.set('wardId', loginUser.id.toString());
      url.searchParams.set('deviceId', selectedDevice);
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
      if (attempt >= 5) {
        setError('WebSocket连接已断开，请检查网络后刷新页面');
        message.warning('连接已断开，请检查网络后刷新页面');
      }
    },
    onOpen: () => {
      setError(null);
    }
  }), [handleWebSocketMessage]);

  // 使用自定义hook管理WebSocket连接
  const { status, reconnect, close } = useStableWebSocket(wsUrl, wsOptions);

  // 设备切换处理
  const handleDeviceChange = useCallback(async (deviceId: string) => {
    if (deviceId === selectedDevice) return;

    setIsSwitching(true);
    setError(null);
    try {
      // 关闭当前连接
      close(1000, '设备切换');
      // 更新选中设备
      setSelectedDevice(deviceId);
      // 重新连接WebSocket
      reconnect();
    } catch (err) {
      console.error('设备切换失败:', err);
      setError('设备切换失败');
      message.error('设备切换失败');
    } finally {
      setIsSwitching(false);
    }
  }, [selectedDevice, close, reconnect]);

  // 格式化围栏数据
  const formattedFences = useMemo(() => {
    if (!showFences) return [];

    return currentFences.map(fence => ({
      id: fence.id!,
      name: fence.name || '未命名围栏',
      coordinates: fence.coordinates,
      color: fence.color || '#1890ff'
    }));
  }, [currentFences, showFences]);

  // 初始化
  useEffect(() => {
    const init = async () => {
      try {
        await fetchDevices();
      } catch (err) {
        console.error('初始化失败:', err);
        setError('初始化失败，请刷新页面重试');
      }
    };
    init();

    return () => {
      close(1000, '组件卸载');
    };
  }, []);

  // 当前显示设备
  const displayDevices = useMemo(() => {
    return Object.values(devices).filter((d) =>
      showAll || d.deviceId === selectedDevice
    );
  }, [devices, showAll, selectedDevice]);

  // 报警浮窗渲染
  const renderAlerts = useMemo(() => {
    if (alerts.length === 0) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 80,
        right: 20,
        zIndex: 9999,
        width: 400,
        maxHeight: '70vh',
        overflowY: 'auto',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '2px solid #ff4d4f'
      }}>
        <div style={{
          padding: '12px 16px',
          background: '#ff4d4f',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text strong style={{ color: 'white', fontSize: 16 }}>
            报警通知 ({alerts.length})
          </Text>
          <Button
            size="small"
            type="text"
            style={{ color: 'white' }}
            onClick={() => setAlerts([])}
          >
            清空所有
          </Button>
        </div>

        <div style={{ padding: 16 }}>
          {alerts.map((alert, index) => (
            <div key={index} style={{
              marginBottom: 16,
              padding: 12,
              borderLeft: '3px solid #ff4d4f',
              background: '#fffafa'
            }}>
              <div style={{ display: 'flex', marginBottom: 8 }}>
                <Tag color="red">{alert.type === 'GEO_FENCE' ? '围栏报警' : alert.type}</Tag>
                <Text strong style={{ marginLeft: 8 }}>{alert.title}</Text>
              </div>

              <Text>{alert.message}</Text>

              <div style={{ marginTop: 8 }}>
                <Text type="secondary">围栏: {alert.fenceName}</Text>
              </div>

              {alert.longitude && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    位置: {alert.latitude?.toFixed(6)}, {alert.longitude?.toFixed(6)}
                  </Text>
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(alert.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [alerts]);

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
      {/* 报警浮窗 */}
      {renderAlerts}

      {/* 错误提示 */}
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
                <Text>总围栏数: <Tag color="purple">{allFences.length}</Tag></Text>
                <Text>当前设备: <Tag color="blue">{currentFences.length}</Tag></Text>
                <Text>显示中: <Tag color="green">{showFences ? currentFences.length : 0}</Tag></Text>
              </div>

              <Divider />

            </Space>
          </MonitorCard>
        </div>
      </Spin>
    </PageContainer>
  );
};

export default LiveMonitor;
