// components/AMapRealTime.tsx
import { Amap, Marker, Polyline } from '@amap/amap-react';
import React, { useMemo } from 'react';

interface MarkerData {
  position: [number, number];
  accuracy: number;
  deviceId: string;
}

interface AMapRealTimeProps {
  markers: MarkerData[];
  connectionStatus?: string;
  onReload?: () => void;
}

const AMapRealTime: React.FC<AMapRealTimeProps> = ({ markers, connectionStatus }) => {
  const paths = useMemo(
    () => markers.map(m => [m.position[0], m.position[1]]),
    [markers]
  );


  return (
    <Amap zoom={15}>
      {markers.map((marker, index) => (
        <Marker
          key={index}
          position={marker.position}
          // @ts-ignore
          content={`
            <div class="custom-marker">
              <div class="accuracy" style="width:${marker.accuracy * 2}px"></div>
              <div class="device-id">${marker.deviceId}</div>
            </div>
          `}
        />
      ))}
      <Polyline
        path={paths}
        // @ts-ignore
        style={{ strokeColor: '#1890ff', strokeWeight: 4 }}
      />
    </Amap>
  );
};

export default AMapRealTime;
