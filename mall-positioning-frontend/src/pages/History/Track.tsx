// src/pages/history/index.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Select,
  Button,
  DatePicker,
  Radio,
  Space,
  Spin,
  message,
  Typography,
  Divider,
  Tag
} from 'antd';
import {
  EyeOutlined,
  DownloadOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useModel } from '@umijs/max';
import { history } from 'umi';
import StableAMap from '@/components/StableAMap';
import {
  getMySelfDeviceInfoUsingGet,
  getWardDeviceUsingGet,
} from '@/services/MapBackend/deviceController';
import { downloadCSV } from '@/utils/fileDownload';
import { getLocationHistoryUsingGet } from '@/services/MapBackend/locationDataController';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const timeRangeOptions = [
  { label: '最近1小时', value: 'hour', icon: <ClockCircleOutlined /> },
  { label: '最近24小时', value: 'day', icon: <HistoryOutlined /> },
  { label: '最近7天', value: 'week', icon: <CalendarOutlined /> },
  { label: '自定义范围', value: 'custom' },
];

const HistoryPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const { loginUser } = initialState || {};

  const [devices, setDevices] = useState<API.DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('hour');
  const [customRange, setCustomRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>();
  const [locationData, setLocationData] = useState<API.LocationResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);

  // 处理设备数据响应，统一转为数组格式
  const normalizeDeviceData = (data: any): API.DeviceInfo[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.deviceId) return [data];
    return [];
  };

  // 获取设备列表
  useEffect(() => {
    const fetchDevices = async () => {
      if (!loginUser?.id) return;

      setLoading(true);
      try {
        const response = loginUser.userRole === 'ward'
          ? await getMySelfDeviceInfoUsingGet({ id: loginUser.id })
          : await getWardDeviceUsingGet({ guardianId: loginUser.id.toString() });

        const devicesData = normalizeDeviceData(response?.data);

        if (response.code === 0) {
          setDevices(devicesData);
          if (devicesData.length > 0) {
            setSelectedDevice(devicesData[0].deviceId || '');
          }
        } else {
          message.warning(response.message || '获取设备列表失败');
        }
      } catch (error) {
        console.error('获取设备列表失败:', error);
        message.error('获取设备列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [loginUser]);

  // 获取历史轨迹数据
  useEffect(() => {
    const fetchLocationHistory = async () => {
      if (!selectedDevice) return;

      setMapLoading(true);
      try {
        let startTime: string, endTime: string;

        switch (timeRange) {
          case 'hour':
            startTime = dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
            endTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
            break;
          case 'day':
            startTime = dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss');
            endTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
            break;
          case 'week':
            startTime = dayjs().subtract(1, 'week').format('YYYY-MM-DD HH:mm:ss');
            endTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
            break;
          case 'custom':
            if (customRange) {
              startTime = customRange[0].format('YYYY-MM-DD HH:mm:ss');
              endTime = customRange[1].format('YYYY-MM-DD HH:mm:ss');
            } else {
              return;
            }
            break;
          default:
            return;
        }

        const response = await getLocationHistoryUsingGet({
          deviceId: selectedDevice,
          startTime,
          endTime
        });

        if (response.code === 0) {
          setLocationData(Array.isArray(response.data) ? response.data : []);
        } else {
          message.warning(response.message || '获取历史轨迹失败');
        }
      } catch (error) {
        console.error('获取历史轨迹失败:', error);
        message.error('获取历史轨迹失败');
      } finally {
        setMapLoading(false);
      }
    };

    fetchLocationHistory();
  }, [selectedDevice, timeRange, customRange]);

  // 导出轨迹数据
  const handleExport = () => {
    if (locationData.length === 0) {
      message.warning('没有可导出的数据');
      return;
    }

    const currentDevice = devices.find(d => d.deviceId === selectedDevice);
    const csvData = [
      ['时间', '经度', '纬度', '精度(m)', '设备名称', '被监护人'],
      ...locationData.map(item => [
        dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
        item.longitude,
        item.latitude,
        item.accuracy || 'N/A',
        currentDevice?.deviceName || '未知设备',
        currentDevice?.wardName || '未知'
      ])
    ];

    const fileName = `轨迹数据_${currentDevice?.deviceName || selectedDevice}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    downloadCSV(csvData, fileName);
    message.success('导出成功');
  };

  // 格式化地图数据
  const mapData = useMemo(() => {
    const currentDevice = devices.find(d => d.deviceId === selectedDevice);
    return locationData.map(item => ({
      deviceId: selectedDevice,
      name: currentDevice?.deviceName || '设备',
      longitude: item.longitude as number,
      latitude: item.latitude as number,
      accuracy: item.accuracy as number,
      timestamp: item.createTime,
      wardName: currentDevice?.wardName || '未知'
    }));
  }, [locationData, selectedDevice, devices]);

  // 计算轨迹统计信息
  const stats = useMemo(() => {
    if (locationData.length < 2) return null;

    const first = locationData[0];
    const last = locationData[locationData.length - 1];
    const duration = dayjs(last.createTime).diff(dayjs(first.createTime), 'minute');
    const currentDevice = devices.find(d => d.deviceId === selectedDevice);

    return {
      pointCount: locationData.length,
      duration: `${duration} 分钟`,
      startTime: dayjs(first.createTime).format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs(last.createTime).format('YYYY-MM-DD HH:mm:ss'),
      deviceName: currentDevice?.deviceName || '未知设备',
      wardName: currentDevice?.wardName || '未知',
      guardianName: currentDevice?.guardianName || '未知'
    };
  }, [locationData, selectedDevice, devices]);

  return (
    <PageContainer
      title="历史轨迹查询"
      // @ts-ignore
      breadcrumb={{ items: [{ title: '首页', path: '/' }, { title: '历史轨迹' }] }}
      extra={[
        <Button
          key="export"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          disabled={!locationData.length}
        >
          导出轨迹
        </Button>,
        <Button
          key="live"
          icon={<EyeOutlined />}
          onClick={() => history.push(`/monitor/live/${selectedDevice}`)}
          disabled={!selectedDevice}
        >
          实时监控
        </Button>
      ]}
    >
      <Card>
        <Space size="large" style={{ marginBottom: 24, width: '100%' }}>
          <Select
            style={{ width: 300 }}
            placeholder="选择设备"
            value={selectedDevice || undefined}
            onChange={setSelectedDevice}
            loading={loading}
            options={devices.map(device => ({
              label: `${device.deviceName || '未知设备'} (${device.wardName || '未知'})`,
              value: device.deviceId || ''
            }))}
          />

          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={timeRangeOptions}
            value={timeRange}
            onChange={e => {
              setTimeRange(e.target.value);
              if (e.target.value !== 'custom') setCustomRange(undefined);
            }}
          />

          {timeRange === 'custom' && (
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              value={customRange}
              onChange={dates => setCustomRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
          )}

          <Button type="primary" loading={mapLoading} onClick={() => setMapLoading(true)}>
            查询
          </Button>
        </Space>

        {stats && (
          <div style={{ marginBottom: 16 }}>
            <Space size="large" wrap>
              <Text>设备: <Tag color="blue">{stats.deviceName}</Tag></Text>
              {loginUser?.userRole === 'ward' ? (
                <Text>监护人: <Tag color="green">{stats.guardianName}</Tag></Text>
              ) : (
                <Text>被监护人: <Tag color="green">{stats.wardName}</Tag></Text>
              )}
              <Text>轨迹点数: <Tag color="orange">{stats.pointCount}</Tag></Text>
              <Text>持续时间: <Tag>{stats.duration}</Tag></Text>
            </Space>
          </div>
        )}

        <Divider />

        <Spin spinning={mapLoading} tip="加载轨迹数据...">
          <div style={{ height: '600px', position: 'relative' }}>
            {locationData.length > 0 ? (
              <StableAMap
                devices={mapData}
                showPath
                center={mapData[0] ? {
                  longitude: mapData[0].longitude,
                  latitude: mapData[0].latitude
                } : undefined}
              />
            ) : (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#999'
              }}>
                {selectedDevice ? '暂无轨迹数据' : '请选择设备'}
              </div>
            )}
          </div>
        </Spin>
      </Card>
    </PageContainer>
  );
};

export default HistoryPage;
