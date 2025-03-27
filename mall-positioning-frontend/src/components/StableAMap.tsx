// src/components/StableAMap.tsx
import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: {
      securityJsCode?: string;
    };
  }
}

interface StableAMapProps {
  devices: Array<{
    deviceId: string;
    name: string;
    longitude: number;
    latitude: number;
    accuracy?: number;
    timestamp?: string;
  }>;
  center?: { longitude: number; latitude: number };
  zoom?: number;
  showPath?: boolean;
}

const StableAMap: React.FC<StableAMapProps> = ({
                                                 devices = [],
                                                 center,
                                                 zoom = 15,
                                                 showPath = false
                                               }) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const pathRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 初始化地图（保持不变）
  useEffect(() => {
    if (window.AMap) {
      initMap();
      return;
    }

    window._AMapSecurityConfig = {
      securityJsCode: '您的安全密钥'
    };

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=1170acb8a7694eab86d82b306f5f5bd2&plugin=AMap.Geolocation,AMap.Scale,AMap.Polyline`;
    script.async = true;

    script.onload = () => {
      if (window.AMap) {
        initMap();
      } else {
        console.error('AMap未正确加载');
      }
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  const initMap = () => {
    const defaultCenter = [116.397428, 39.90923];
    const map = new window.AMap.Map('map-container', {
      zoom: zoom,
      center: defaultCenter,
      viewMode: '3D',
      showIndoorMap: true,
      expandZoomRange: true
    });

    map.addControl(new window.AMap.Scale());
    mapRef.current = map;
    setMapLoaded(true);
  };

  // 更新地图标记和轨迹
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // 清除旧标记和路径
    markersRef.current.forEach(marker => mapRef.current.remove(marker));
    markersRef.current = [];

    if (pathRef.current) {
      mapRef.current.remove(pathRef.current);
      pathRef.current = null;
    }

    if (devices.length === 0 && !center) return;

    // 创建轨迹路径
    if (showPath && devices.length > 1) {
      const path = devices.map(d => [d.longitude, d.latitude]);
      pathRef.current = new window.AMap.Polyline({
        path: path,
        isOutline: true,
        outlineColor: '#ffeeff',
        borderWeight: 1,
        strokeColor: '#1890ff',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        lineJoin: 'round',
        lineCap: 'round'
      });
      pathRef.current.setMap(mapRef.current);
      markersRef.current.push(pathRef.current);
    }

    // 创建简洁的标记点（只显示小圆点）
    devices.forEach(device => {
      const position = new window.AMap.LngLat(device.longitude, device.latitude);

      // 创建简洁标记
      const marker = new window.AMap.Marker({
        position: position,
        content: `
          <div style="
            width: 12px;
            height: 12px;
            background: #1890ff;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          "></div>
        `,
        map: mapRef.current,
        offset: new window.AMap.Pixel(-6, -6) // 精确居中
      });

      // 可选：保留精度范围圆（如需更简洁可移除）
      if (device.accuracy && false) { // 设置为false不显示精度圈
        const circle = new window.AMap.Circle({
          center: position,
          radius: device.accuracy,
          strokeColor: "#1890ff",
          strokeOpacity: 0.3,
          strokeWeight: 1,
          fillColor: "#1890ff",
          fillOpacity: 0.1
        });
        circle.setMap(mapRef.current);
        markersRef.current.push(circle);
      }

      markersRef.current.push(marker);
    });

    // 调整视图
    if (center) {
      mapRef.current.setCenter([center.longitude, center.latitude]);
      mapRef.current.setZoom(zoom);
    } else if (devices.length > 0) {
      mapRef.current.setFitView(
        markersRef.current.filter(m => m.getPosition),
        true,
        [60, 60, 60, 60],
        100
      );
    }
  }, [devices, center, mapLoaded, zoom, showPath]);

  return (
    <div id="map-container" style={{ width: '100%', height: '100%' }}>
      {!mapLoaded && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: '#666'
        }}>
          地图加载中...
        </div>
      )}
    </div>
  );
};

export default StableAMap;
