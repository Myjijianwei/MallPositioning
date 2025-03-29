import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, message, Modal, Select, Space, Table, Tag, Typography, Alert, Switch, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, SyncOutlined, CheckOutlined, CloseOutlined, EditOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import dayjs from 'dayjs';
import StableAMap from '@/components/StableAMap';
import {
  createGeoFenceUsingPost,
  listFencesUsingGet,
  deleteGeoFenceUsingPost
} from '@/services/MapBackend/geoFenceController';
import useDeviceModel from '@/models/deviceModel';

const { Text } = Typography;

interface GeoFence extends API.GeoFence {
  coordinates: [number, number][];
}

const FencePage: React.FC = () => {
  const {
    devices,
    loading: devicesLoading,
    fetchDevices,
    fetchDeviceLocation,
    getDeviceStatus
  } = useDeviceModel();

  const [selectedDevice, setSelectedDevice] = useState<string>();
  const [drawingMode, setDrawingMode] = useState(false);
  const [tempFence, setTempFence] = useState<[number, number][]>([]);
  const [showConfirmButtons, setShowConfirmButtons] = useState(false);
  const [visibleFences, setVisibleFences] = useState<Record<string, boolean>>({});
  const [mapKey, setMapKey] = useState(0);

  const tempFenceRef = useRef<[number, number][]>([]);
  const selectedDeviceRef = useRef<string>();

  useEffect(() => {
    selectedDeviceRef.current = selectedDevice;
    tempFenceRef.current = tempFence;
  }, [selectedDevice, tempFence]);

  const currentStatus = selectedDevice ? getDeviceStatus(selectedDevice) : null;
  const currentDevice = devices.find(d => d.deviceId === selectedDevice);

  useEffect(() => {
    const init = async () => {
      await fetchDevices();
      if (devices.length > 0 && !selectedDevice) {
        // @ts-ignore
        handleDeviceChange(devices[0].deviceId);
      }
    };
    init();
  }, []);

  // Fetch fences for selected device
  const { data: fences = [], run: loadFences, loading: fencesLoading } = useRequest(
    async (deviceId?: string) => {
      if (!deviceId) return [];
      try {
        const res = await listFencesUsingGet({ deviceId });
        const fencesData = (res.data || []).map(f => ({
          ...f,
          // @ts-ignore
          coordinates: Array.isArray(f.coordinates) ? f.coordinates : JSON.parse(f.coordinates || '[]')
        })) as GeoFence[];

        setVisibleFences(prev => ({
          ...prev,
          ...fencesData.reduce((acc, fence) => ({
            ...acc,
            [fence.id!]: prev[fence.id!] !== false
          }), {})
        }));

        return fencesData;
      } catch (error) {
        message.error('获取围栏数据失败');
        return [];
      }
    },
    { manual: true }
  );

  // API operations
  const { run: createFence } = useRequest(createGeoFenceUsingPost, {
    manual: true,
    onSuccess: () => {
      message.success('围栏创建成功');
      resetDrawingState();
      loadFences(selectedDeviceRef.current);
      setMapKey(prev => prev + 1);
    },
    onError: (error) => {
      message.error(`创建失败: ${error.message}`);
    }
  });

  const { run: deleteFence } = useRequest(deleteGeoFenceUsingPost, {
    manual: true,
    onSuccess: () => {
      message.success('围栏删除成功');
      loadFences(selectedDeviceRef.current);
      setMapKey(prev => prev + 1);
    },
    onError: (error) => {
      message.error(`删除失败: ${error.message}`);
    }
  });

  // Reset drawing state
  const resetDrawingState = useCallback(() => {
    setDrawingMode(false);
    setShowConfirmButtons(false);
    setTempFence([]);
    tempFenceRef.current = [];
  }, []);

  // Handle device change
  const handleDeviceChange = useCallback(async (value: string) => {
    resetDrawingState();
    setSelectedDevice(value);
    await fetchDeviceLocation(value);
    loadFences(value);
    setTimeout(() => setMapKey(prev => prev + 1), 300);
  }, []);

  // Handle fence drawing completion
  const handleFenceDrawn = useCallback((coordinates: [number, number][]) => {
    const validCoords = coordinates.length >= 3 ? coordinates : [];
    setTempFence(validCoords);
    tempFenceRef.current = validCoords;
    setShowConfirmButtons(validCoords.length >= 3);
  }, []);

  // Confirm fence creation
  const confirmFence = useCallback(() => {
    const finalCoordinates = tempFence.length > 0 ? tempFence : tempFenceRef.current;
    const currentDeviceId = selectedDeviceRef.current;

    if (!currentDeviceId || finalCoordinates.length < 3) {
      message.error('无法提交围栏：缺少必要参数');
      return;
    }

    Modal.confirm({
      title: '确认创建电子围栏',
      content: (
        <div>
          <p>将为设备创建包含 {finalCoordinates.length} 个顶点的电子围栏</p>
          <Alert
            type="info"
            message="围栏创建后，当设备超出该区域时会触发报警"
            showIcon
          />
        </div>
      ),
      onOk: () => {
        return createFence({
          deviceId: currentDeviceId,
          coordinates: finalCoordinates,
          name: `围栏-${dayjs().format('YYYY-MM-DD HH:mm')}`
        });
      }
    });
  }, [tempFence]);

  // Toggle fence visibility
  const toggleFenceVisibility = useCallback((fenceId: string, visible: boolean) => {
    setVisibleFences(prev => ({
      ...prev,
      [fenceId]: visible
    }));
  }, []);

  // Toggle all fences visibility
  const toggleAllFencesVisibility = useCallback((visible: boolean) => {
    const newVisibility = fences.reduce((acc, fence) => ({
      ...acc,
      [fence.id!]: visible
    }), {});
    setVisibleFences(newVisibility);
  }, [fences]);

  // Filter visible fences
  const visibleFencesData = fences.filter(fence => visibleFences[fence.id!] !== false);
  const hasHiddenFences = fences.some(fence => !visibleFences[fence.id!]);
  const allVisible = fences.length > 0 && fences.every(fence => visibleFences[fence.id!]);

  return (
    <PageContainer
      title="电子围栏管理"
      extra={[
        <Select
          key="device-select"
          style={{ width: 300 }}
          placeholder={devicesLoading ? '加载设备中...' : '选择设备'}
          value={selectedDevice}
          onChange={handleDeviceChange}
          loading={devicesLoading}
          disabled={devicesLoading}
          options={devices.map(d => {
            // @ts-ignore
            const status = getDeviceStatus(d.deviceId);
            return {
              label: (
                <Space>
                  <span>{d.deviceName || '未命名设备'}</span>
                  <Tag color={status?.hasLocation ? 'green' : 'orange'}>
                    {status?.hasLocation ? '已激活' : '需激活'}
                  </Tag>
                </Space>
              ),
              value: d.deviceId
            };
          })}
        />
      ]}
    >
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Device status card */}
          {currentDevice && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space size="large" align="center">
                <Text strong>设备: <Tag color="blue">{currentDevice.deviceName}</Tag></Text>
                {currentDevice.wardName && (
                  <Text>被监护人: <Tag color="green">{currentDevice.wardName}</Tag></Text>
                )}

                {currentStatus?.hasLocation ? (
                  <Space>
                    <Text>最后定位:
                      <Tag color="cyan">
                        {dayjs(currentStatus.lastUpdate).format('YYYY-MM-DD HH:mm')}
                      </Tag>
                    </Text>
                    <Tooltip title="刷新位置">
                      <Button
                        size="small"
                        icon={<SyncOutlined />}
                        onClick={() => fetchDeviceLocation(selectedDevice!)}
                      />
                    </Tooltip>
                  </Space>
                ) : (
                  <Alert
                    type="warning"
                    message="该设备尚未激活定位功能，暂不支持设置电子围栏"
                    showIcon
                    closable
                  />
                )}
              </Space>
            </Card>
          )}

          {/* Action buttons */}
          <Space wrap style={{ marginBottom: 16 }}>
            <Button
              type={drawingMode ? 'primary' : 'default'}
              icon={<PlusOutlined />}
              onClick={() => {
                if (!currentStatus?.hasLocation) {
                  message.warning('请先确保设备有定位信息');
                  return;
                }
                setDrawingMode(!drawingMode);
                message.info(drawingMode ? '已退出绘制模式' : '绘制模式: 点击地图添加围栏顶点');
              }}
              disabled={!currentStatus?.hasLocation}
            >
              {drawingMode ? '取消绘制' : '新建围栏'}
            </Button>

            {showConfirmButtons && (
              <Space>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={confirmFence}
                  disabled={tempFence.length < 3}
                >
                  确认围栏
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={resetDrawingState}
                >
                  取消
                </Button>
              </Space>
            )}

            {fences.length > 0 && (
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => toggleAllFencesVisibility(true)}
                  disabled={allVisible}
                >
                  显示全部
                </Button>
                <Button
                  icon={<EyeInvisibleOutlined />}
                  onClick={() => toggleAllFencesVisibility(false)}
                  disabled={!fences.some(f => visibleFences[f.id!])}
                >
                  隐藏全部
                </Button>
              </Space>
            )}

            <Button
              icon={<SyncOutlined />}
              onClick={() => selectedDevice && loadFences(selectedDevice)}
              loading={fencesLoading}
            >
              刷新围栏
            </Button>
          </Space>

          {/* Map container */}
          <div style={{
            height: '500px',
            border: '1px solid #f0f0f0',
            borderRadius: 4,
            position: 'relative',
            marginBottom: 16
          }}>
            <StableAMap
              key={`${selectedDevice}-${mapKey}`}
              // @ts-ignore
              fences={visibleFencesData}
              showFences
              drawingMode={drawingMode}
              onFenceDrawn={handleFenceDrawn}
              // @ts-ignore
              center={currentStatus?.location ? {
                longitude: currentStatus.location.longitude,
                latitude: currentStatus.location.latitude
              } : undefined}
              // @ts-ignore
              devices={currentStatus?.hasLocation ? [{
                deviceId: currentDevice?.deviceId || '',
                name: currentDevice?.deviceName || '未命名设备',
                longitude: currentStatus.location.longitude,
                latitude: currentStatus.location.latitude,
                timestamp: currentStatus.lastUpdate,
                accuracy: currentStatus.location.accuracy
              }] : []}
            />

            {drawingMode && (
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                zIndex: 100,
                background: 'rgba(255,255,255,0.9)',
                padding: 8,
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                <Text type="secondary">
                  {tempFence.length > 0 ?
                    `已添加 ${tempFence.length} 个顶点，继续添加或右键完成` :
                    '请点击地图添加围栏顶点'}
                </Text>
              </div>
            )}
          </div>

          {/* Fences table */}
          <Table
            dataSource={fences}
            loading={fencesLoading}
            rowKey="id"
            pagination={false}
            locale={{
              emptyText: selectedDevice ? '暂无电子围栏数据' : '请先选择设备'
            }}
            columns={[
              {
                title: '显示',
                width: 80,
                render: (_, record) => (
                  <Switch
                    checked={visibleFences[record.id!] !== false}
                    // @ts-ignore
                    onChange={(checked) => toggleFenceVisibility(record.id!, checked)}
                  />
                )
              },
              {
                title: '围栏信息',
                render: (_, record) => (
                  <Space direction="vertical" size={4}>
                    <Text strong>{record.name}</Text>
                    <Space size="small">
                      <Tag color="blue">{record.coordinates.length}个顶点</Tag>
                    </Space>
                  </Space>
                )
              },
              {
                title: '创建时间',
                dataIndex: "createdAt",
                render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
              },
              {
                title: '操作',
                width: 150,
                render: (_, record) => (
                  <Tooltip title="删除">
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        Modal.confirm({
                          title: `确定要删除围栏 "${record.name}" 吗？`,
                          content: '删除后无法恢复',
                          okText: '确认删除',
                          okType: 'danger',
                          // @ts-ignore
                          onOk: () => deleteFence({ id: record.id })
                        });
                      }}
                    />
                  </Tooltip>
                )
              }
            ]}
          />
        </Space>
      </Card>
    </PageContainer>
  );
};

export default FencePage;
