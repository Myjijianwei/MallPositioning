import React, { useEffect, useRef, useState } from 'react';

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
    longitude: number;
    latitude: number;
    accuracy?: number;
  }>;
  center?: { longitude: number; latitude: number };
  zoom?: number;
}

const StableAMap: React.FC<StableAMapProps> = ({
                                                 devices = [],
                                                 center,
                                                 zoom = 15
                                               }) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 安全初始化地图
  useEffect(() => {
    // 配置安全密钥（如果需要）
    window._AMapSecurityConfig = {
      securityJsCode: '您的高德安全密钥'
    };

    // 检查是否已加载AMap
    if (window.AMap) {
      initMap();
      return;
    }

    // 动态加载AMap JSAPI
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=1170acb8a7694eab86d82b306f5f5bd2&plugin=AMap.Geolocation`;
    script.async = true;

    script.onload = () => {
      if (window.AMap) {
        initMap();
      } else {
        console.error('AMap未正确加载');
      }
    };

    script.onerror = () => {
      console.error('加载AMap脚本失败');
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
    const mapCenter = center
      ? [center.longitude, center.latitude]
      : devices.length > 0
        ? [devices[0].longitude, devices[0].latitude]
        : [116.397428, 39.90923];

    const map = new window.AMap.Map('map-container', {
      zoom,
      center: mapCenter,
      viewMode: '2D'
    });
    mapRef.current = map;
    setMapLoaded(true);
  };

  // 更新标记点
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // 清除旧标记
    markersRef.current.forEach(marker => {
      mapRef.current.remove(marker);
    });
    markersRef.current = [];

    // 添加新标记
    devices.forEach(device => {
      if (!device.longitude || !device.latitude) return;

      const marker = new window.AMap.Marker({
        position: [device.longitude, device.latitude],
        content: createMarkerContent(device),
        map: mapRef.current
      });
      markersRef.current.push(marker);
    });

    // 自动调整视野
    if (devices.length > 0) {
      mapRef.current.setFitView(markersRef.current);
    }
  }, [devices, center, mapLoaded]);

  const createMarkerContent = (device: any) => {
    return `
      <div style="
        background: white;
        padding: 8px;
        border-radius: 4px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        min-width: 120px;
      ">
        <div style="font-weight: bold; color: #1890ff;">${device.deviceId}</div>
        <div style="
          width: ${(device.accuracy || 10) * 2}px;
          height: ${(device.accuracy || 10) * 2}px;
          border-radius: 50%;
          background: rgba(24,144,255,0.2);
          margin: 8px auto;
        "></div>
      </div>
    `;
  };

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
