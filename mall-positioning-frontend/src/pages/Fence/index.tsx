import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, message, Modal, Select, Space, Table, Tag, Typography, Alert, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, SyncOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import dayjs from 'dayjs';
import StableAMap from '@/components/StableAMap';
import {
  createGeoFenceUsingPost,
  listFencesUsingGet,
} from '@/services/MapBackend/geoFenceController';
import useDeviceModel from '@/models/deviceModel';

const { Text } = Typography;

const FencePage: React.FC = () => {
  const {
    devices,
    deviceLocations,
    loading: devicesLoading,
    fetchDevices,
    fetchDeviceLocation,
    getDeviceStatus
  } = useDeviceModel();

  const [selectedDevice, setSelectedDevice] = useState<string>();
  const [drawingMode, setDrawingMode] = useState(false);
  const [tempFence, setTempFence] = useState<[number, number][]>([]);
  const [showConfirmButtons, setShowConfirmButtons] = useState(false);

  // 当前设备状态
  const currentStatus = selectedDevice ? getDeviceStatus(selectedDevice) : null;

  // 初始化加载设备
  useEffect(() => {
    fetchDevices();
  }, []);

  // 围栏数据请求
  const { data: fences = [], run: loadFences, loading: fencesLoading } = useRequest(
    async (deviceId?: string) => {
      if (!deviceId) return [];
      const res = await listFencesUsingGet({ deviceId });
      return res.data?.map(f => ({
        ...f,
        coordinates: Array.isArray(f.coordinates) ? f.coordinates : JSON.parse(f.coordinates || '[]')
      })) || [];
    },
    { manual: true }
  );

  // 创建围栏 - 修改为直接传递数组
  const { run: createFence } = useRequest(createGeoFenceUsingPost, {
    manual: true,
    onSuccess: () => {
      message.success('围栏创建成功');
      loadFences(selectedDevice);
      setDrawingMode(false);
      setShowConfirmButtons(false);
    },
    onError: (error) => {
      message.error(`创建失败: ${error.message}`);
    }
  });

  // 设备选择变化
  const handleDeviceChange = async (value: string) => {
    setSelectedDevice(value);
    await fetchDeviceLocation(value);
    loadFences(value);
  };

  // 处理围栏绘制完成
  const handleFenceDrawn = (coordinates: [number, number][]) => {
    if (coordinates.length < 3) {
      message.warning('至少需要3个点才能创建围栏');
      return;
    }
    setTempFence(coordinates);
    setShowConfirmButtons(true);
  };

  // 确认围栏提交
  const confirmFence = () => {
    if (!selectedDevice || tempFence.length < 3) return;

    Modal.confirm({
      title: '确认创建电子围栏',
      content: (
        <div>
          <p>将为设备创建包含 {tempFence.length} 个顶点的电子围栏</p>
          <Alert
            type="info"
            message="围栏创建后，当设备超出该区域时会触发报警"
            showIcon
          />
        </div>
      ),
      okText: '确认创建',
      cancelText: '再检查下',
      onOk: () => {
        createFence({
          deviceId: selectedDevice,
          coordinates: tempFence, // 直接传递数组
          name: `围栏-${dayjs().format('YYYY-MM-DD HH:mm')}`
        });
      }
    });
  };

  // 当前选中设备
  const currentDevice = devices.find(d => d.deviceId === selectedDevice);

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
            const status = getDeviceStatus(d.deviceId);
            return {
              label: (
                <Space>
                  <span>{d.deviceName || '未命名设备'}</span>
                  {!status.hasLocation && (
                    <Tag color="orange">需激活</Tag>
                  )}
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
          {/* 设备状态提示 */}
          {currentDevice && (
            <Card size="small">
              <Space size="large" align="center">
                <Text strong>设备: <Tag color="blue">{currentDevice.deviceName}</Tag></Text>
                <Text>监护人: <Tag color="green">{currentDevice.wardName}</Tag></Text>

                {currentStatus?.hasLocation ? (
                  <Space>
                    <Text>最后定位:
                      <Tag color="cyan">
                        {dayjs(currentStatus.lastUpdate).format('YYYY-MM-DD HH:mm')}
                      </Tag>
                    </Text>
                    <Button
                      size="small"
                      icon={<SyncOutlined />}
                      onClick={() => fetchDeviceLocation(selectedDevice!)}
                    />
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

          {/* 操作按钮区域 */}
          <Space>
            <Button
              type={drawingMode ? 'primary' : 'default'}
              icon={<PlusOutlined />}
              onClick={() => {
                if (!currentStatus?.hasLocation) {
                  message.warning('请先确保设备有定位信息');
                  return;
                }
                const newMode = !drawingMode;
                setDrawingMode(newMode);
                setShowConfirmButtons(false);
                message.info(newMode ?
                  '绘制模式: 点击地图添加围栏顶点，至少需要3个点' :
                  '已退出绘制模式');
              }}
              disabled={!currentStatus?.hasLocation}
            >
              {drawingMode ? '取消绘制' : '新建围栏'}
            </Button>

            {showConfirmButtons && (
              <Space>
                <Popconfirm
                  title="确认提交当前围栏？"
                  onConfirm={confirmFence}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                  >
                    确认围栏
                  </Button>
                </Popconfirm>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setShowConfirmButtons(false);
                    setDrawingMode(false);
                  }}
                >
                  取消
                </Button>
              </Space>
            )}
          </Space>

          {/* 地图容器 - 确保传递了正确的设备位置 */}
          <div style={{
            height: '500px',
            border: '1px solid #f0f0f0',
            borderRadius: 4,
            position: 'relative'
          }}>
            <StableAMap
              key={selectedDevice}
              fences={fences}
              showFences
              drawingMode={drawingMode}
              onFenceDrawn={handleFenceDrawn}
              center={currentStatus?.location ? {
                longitude: currentStatus.location.longitude,
                latitude: currentStatus.location.latitude
              } : undefined}
              devices={currentStatus?.hasLocation ? [{
                deviceId: currentDevice?.deviceId || '',
                name: currentDevice?.deviceName || '未命名设备',
                longitude: currentStatus.location.longitude,
                latitude: currentStatus.location.latitude,
                timestamp: currentStatus.lastUpdate,
                accuracy: currentStatus.location.accuracy
              }] : []}
            />

            {/* 绘制提示 */}
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

          {/* 围栏列表 */}
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
                title: '围栏名称',
                render: (_, record) => (
                  <Space>
                    <Text strong>{record.name}</Text>
                    <Tag color="blue">{record.coordinates.length}个顶点</Tag>
                  </Space>
                )
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
              },
              {
                title: '操作',
                width: 120,
                render: (_, record) => (
                  <Popconfirm
                    title="确定要删除这个围栏吗？"
                    onConfirm={() => deleteGeoFenceUsingPost({ id: record.id }).then(() => loadFences(selectedDevice))}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
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
