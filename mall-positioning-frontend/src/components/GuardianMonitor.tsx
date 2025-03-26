import React, { useMemo, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import AMapRealTime from '@/components/AMapRealTime';
import DevicePanel from '@/components/DevicePanel';

interface LocationData {
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const GuardianMonitor: React.FC = () => {
  // 确保 useWebSocket 返回的 locations 有默认值 []
  const { locations = [], status, reconnect } = useWebSocket<LocationData>({
    url: '/api/gps-websocket',
    params: { guardianId: '5' }
  });

  const [currentDevice, setCurrentDevice] = useState<string | null>(null);

  // 安全处理 locations
  const markers = useMemo(() => {
    return Array.isArray(locations)
      ? locations.map(loc => ({
        position: [loc.longitude, loc.latitude] as [number, number],
        deviceId: loc.deviceId,
        accuracy: loc.accuracy,
      }))
      : [];
  }, [locations]);

  return (
    <div className="monitor-container">
      <AMapRealTime
        markers={markers}
        onReload={reconnect}
        connectionStatus={status}
      />
      <DevicePanel
        devices={locations}
        currentLocation={currentDevice}
        onSelectDevice={setCurrentDevice}
      />
    </div>
  );
};

export default GuardianMonitor;
