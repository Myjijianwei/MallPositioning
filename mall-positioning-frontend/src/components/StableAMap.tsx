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
    name: string;
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
  const firstLoadRef = useRef(true);

  useEffect(() => {
    if (window.AMap) {
      initMap();
      return;
    }

    window._AMapSecurityConfig = {
      securityJsCode: '您的安全密钥'
    };

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=1170acb8a7694eab86d82b306f5f5bd2&plugin=AMap.Geolocation,AMap.Scale`;
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
    const defaultCenter = [116.397428, 39.90923];
    const map = new window.AMap.Map('map-container', {
      zoom: 5,
      center: defaultCenter,
      viewMode: '3D',
      showIndoorMap: true,
      expandZoomRange: true
    });

    map.addControl(new window.AMap.Scale());
    mapRef.current = map;
    setMapLoaded(true);
  };

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    markersRef.current.forEach(marker => {
      mapRef.current.remove(marker);
    });
    markersRef.current = [];

    if (devices.length === 0 && !center) {
      return;
    }

    const validDevices = devices.filter(d => d.longitude && d.latitude);
    validDevices.forEach(device => {
      const position = new window.AMap.LngLat(device.longitude, device.latitude);

      const marker = new window.AMap.Marker({
        position: position,
        content: createMarkerContent(device),
        map: mapRef.current,
        offset: new window.AMap.Pixel(-15, -40)
      });

      const circle = new window.AMap.Circle({
        center: position,
        radius: device.accuracy || 10,
        strokeColor: "#1890ff",
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: "#1890ff",
        fillOpacity: 0.1
      });
      circle.setMap(mapRef.current);

      markersRef.current.push(marker, circle);
    });

    const calculateView = () => {
      if (center) {
        return {
          center: [center.longitude, center.latitude],
          zoom: zoom
        };
      } else if (validDevices.length > 0) {
        const points = validDevices.map(d => [d.longitude, d.latitude]);
        return {
          bounds: new window.AMap.Bounds(
            [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1]))],
            [Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))]
          ),
          zoom: null
        };
      } else {
        return {
          center: [116.397428, 39.90923],
          zoom: 5
        };
      }
    };

    const viewConfig = calculateView();

    if (firstLoadRef.current) {
      if (viewConfig.bounds) {
        mapRef.current.setBounds(viewConfig.bounds, true, [60, 60, 60, 60]);
      } else {
        mapRef.current.setCenter(viewConfig.center);
        mapRef.current.setZoom(viewConfig.zoom || zoom);
      }
      firstLoadRef.current = false;
    } else {
      if (viewConfig.bounds) {
        mapRef.current.setFitView(
          markersRef.current.filter(m => m.getPosition),
          true,
          [60, 60, 60, 60],
          100
        );
      } else {
        // 修复点：使用分开的 setCenter 和 setZoom 方法
        mapRef.current.setCenter(viewConfig.center);
        mapRef.current.setZoom(viewConfig.zoom || zoom);
      }
    }
  }, [devices, center, mapLoaded, zoom]);

  const createMarkerContent = (device: any) => {
    return `
      <div style="
        background: white;
        padding: 8px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        min-width: 140px;
        transform: translate(-50%, -100%);
      ">
        <div style="
          font-size: 14px;
          color: #fff;
          background: #1890ff;
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
        ">
          ${device.name || '未知设备'}
        </div>
        <div style="
          width: 24px;
          height: 24px;
          background: url(https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png)
            center/contain no-repeat;
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
