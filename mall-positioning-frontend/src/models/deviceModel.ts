import { useState, useCallback } from 'react';
import { useModel } from '@umijs/max';
import {
  getMySelfDeviceInfoUsingGet,
  getWardDeviceUsingGet,
} from '@/services/MapBackend/deviceController';
import { message } from 'antd';
import { getLatestLocationUsingGet } from '@/services/MapBackend/locationDataController';

export default () => {
  const { initialState } = useModel('@@initialState');
  const [devices, setDevices] = useState<API.DeviceInfo[]>([]);
  const [deviceLocations, setDeviceLocations] = useState<Record<string, API.LocationResponseDTO>>({});
  const [loading, setLoading] = useState(false);

  // 获取设备基础信息
  const fetchDevices = async () => {
    if (!initialState?.loginUser?.id) return;

    setLoading(true);
    try {
      const response = initialState.loginUser.userRole === 'ward'
        ? await getMySelfDeviceInfoUsingGet({ id: initialState.loginUser.id })
        : await getWardDeviceUsingGet({ guardianId: initialState.loginUser.id.toString() });

      if (response.code === 0) {
        const deviceList = Array.isArray(response.data)
          ? response.data
          : response.data ? [response.data] : [];
        setDevices(deviceList);

        // 并行获取所有设备的最新位置
        await fetchAllDeviceLocations(deviceList.map(d => d.deviceId));
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
      message.error('获取设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取单个设备位置
  const fetchDeviceLocation = async (deviceId: string) => {
    try {
      const res = await getLatestLocationUsingGet({ deviceId });
      if (res.code === 0 && res.data) {
        // @ts-ignore
        setDeviceLocations(prev => ({
          ...prev,
          [deviceId]: res.data
        }));
        return res.data;
      }
    } catch (error) {
      console.error(`获取设备${deviceId}位置失败:`, error);
    }
    return null;
  };

  // 批量获取设备位置
  const fetchAllDeviceLocations = useCallback(async (deviceIds: string[]) => {
    const locationRequests = deviceIds.map(id => fetchDeviceLocation(id));
    await Promise.all(locationRequests);
  }, []);

  // 获取有定位的设备
  const getLocatedDevices = useCallback(() => {
    return devices.filter(d => deviceLocations[d.deviceId]?.longitude && deviceLocations[d.deviceId]?.latitude);
  }, [devices, deviceLocations]);
// 新增获取设备状态方法
  const getDeviceStatus = useCallback((deviceId: string) => {
    const location = deviceLocations[deviceId];
    return {
      hasLocation: !!location?.longitude && !!location?.latitude,
      lastUpdate: location?.createTime,
      location
    };
  }, [deviceLocations]);
  return {
    devices,
    deviceLocations,
    loading,
    fetchDevices,
    fetchDeviceLocation,
    getLocatedDevices,
    getDeviceStatus
  };
};
