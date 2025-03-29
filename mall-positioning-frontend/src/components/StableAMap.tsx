import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button, message } from 'antd';
import dayjs from 'dayjs';

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: {
      securityJsCode?: string;
    };
    initAMap: () => void;
  }
}

interface Device {
  deviceId: string;
  name: string;
  longitude: number;
  latitude: number;
  accuracy?: number;
  timestamp?: string;
}

interface Fence {
  id: string;
  coordinates: [number, number][];
  strokeColor?: string;
  fillColor?: string;
}

interface StableAMapProps {
  devices?: Device[];
  fences?: Fence[];
  center?: { longitude: number; latitude: number };
  zoom?: number;
  showPath?: boolean;
  showFences?: boolean;
}

const StableAMap: React.FC<StableAMapProps> = ({
                                                 devices = [],
                                                 fences = [],
                                                 center,
                                                 zoom = 15,
                                                 showPath = false,
                                                 showFences = true,
                                               }) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const pathRef = useRef<any>(null);
  const fencesRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // 初始化地图
  const initMap = useCallback(() => {
    try {
      if (!window.AMap) {
        throw new Error('AMap SDK 未加载');
      }

      // 设置安全密钥
      window._AMapSecurityConfig = {
        securityJsCode: '您的安全密钥', // 替换为实际的安全密钥
      };

      // 先加载核心SDK
      const map = new window.AMap.Map('map-container', {
        zoom: zoom,
        center: center ? [center.longitude, center.latitude] : [116.397428, 39.90923],
        viewMode: '2D',
        showIndoorMap: false,
        expandZoomRange: true,
      });

      // 动态加载插件
      window.AMap.plugin(
        ['AMap.ToolBar', 'AMap.Scale', 'AMap.Polygon', 'AMap.Polyline'],
        () => {
          // 添加控件
          map.addControl(new window.AMap.ToolBar({ position: 'RB' }));
          map.addControl(new window.AMap.Scale());

          mapRef.current = map;
          setMapLoaded(true);
          setMapError(null);
        }
      );
    } catch (err) {
      console.error('地图初始化失败:', err);
      setMapError('地图初始化失败，请刷新页面重试');
      setMapLoaded(false);
    }
  }, [center, zoom]);

  // 加载地图SDK
  useEffect(() => {
    if (window.AMap) {
      initMap();
      return;
    }

    // 定义全局回调函数
    window.initAMap = initMap;

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=1170acb8a7694eab86d82b306f5f5bd2&callback=initAMap`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      setMapError('地图SDK加载失败');
      message.error('地图SDK加载失败，请检查网络连接');
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch (e) {
          console.error('地图销毁失败:', e);
        }
        mapRef.current = null;
      }
      // @ts-ignore
      delete window.initAMap;
    };
  }, [initMap]);

  // 清理地图元素
  const clearMapElements = useCallback(() => {
    if (!mapRef.current) return;

    try {
      markersRef.current.forEach(marker => {
        mapRef.current?.remove(marker);
      });
      markersRef.current = [];

      fencesRef.current.forEach(fence => {
        mapRef.current?.remove(fence);
      });
      fencesRef.current = [];

      if (pathRef.current) {
        mapRef.current?.remove(pathRef.current);
        pathRef.current = null;
      }
    } catch (err) {
      console.error('清理地图元素失败:', err);
    }
  }, []);

  // 更新设备标记和轨迹
  const updateDevices = useCallback(() => {
    if (!mapRef.current || devices.length === 0) return;

    clearMapElements();

    devices.forEach(device => {
      const marker = new window.AMap.Marker({
        position: [device.longitude, device.latitude],
        content: `
          <div style="position:relative;width:24px;height:24px;">
            <div style="width:100%;height:100%;background:#1890ff;border-radius:50%;border:2px solid white;box-shadow:0 0 10px rgba(24,144,255,0.5);animation:pulse 1.5s infinite;"></div>
            <div style="position:absolute;top:-30px;left:50%;transform:translateX(-50%);background:white;padding:2px 8px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.2);white-space:nowrap;font-size:12px;font-weight:bold;">
              ${device.name}
            </div>
          </div>
          <style>@keyframes pulse{0%{transform:scale(1);opacity:1;}50%{transform:scale(1.2);opacity:0.7;}100%{transform:scale(1);opacity:1;}}</style>
        `,
        offset: new window.AMap.Pixel(-12, -12)
      });

      const infoWindow = new window.AMap.InfoWindow({
        content: `
          <div style="padding:8px;min-width:220px;">
            <h4 style="margin-bottom:8px;">${device.name}</h4>
            <div style="margin-bottom:4px;">
              <span style="color:#666;">位置: </span>
              <span>${device.latitude.toFixed(6)}, ${device.longitude.toFixed(6)}</span>
            </div>
            ${device.accuracy ? `<div style="margin-bottom:4px;"><span style="color:#666;">精度: </span><span>${device.accuracy.toFixed(2)} 米</span></div>` : ''}
            ${device.timestamp ? `<div><span style="color:#666;">时间: </span><span>${dayjs(device.timestamp).format('YYYY-MM-DD HH:mm')}</span></div>` : ''}
          </div>
        `,
        offset: new window.AMap.Pixel(0, -40)
      });

      marker.on('click', () => infoWindow.open(mapRef.current, marker.getPosition()));
      markersRef.current.push(marker);
      mapRef.current.add(marker);
    });

    if (showPath && devices.length > 1) {
      const path = devices.map(d => [d.longitude, d.latitude]);
      pathRef.current = new window.AMap.Polyline({
        path: path,
        strokeColor: '#1890ff',
        strokeWeight: 5,
        strokeOpacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round'
      });
      mapRef.current.add(pathRef.current);
    }
  }, [devices, showPath, clearMapElements]);

  // 更新电子围栏
  const updateFences = useCallback(() => {
    if (!mapRef.current || !showFences || fences.length === 0) return;

    fences.forEach(fence => {
      const polygon = new window.AMap.Polygon({
        path: fence.coordinates,
        strokeColor: fence.strokeColor || '#FF0000',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: fence.fillColor || '#FF000040',
        fillOpacity: 0.4
      });
      fencesRef.current.push(polygon);
      mapRef.current.add(polygon);
    });
  }, [fences, showFences]);

  // 主要更新逻辑
  useEffect(() => {
    if (!mapLoaded) return;

    updateDevices();
    updateFences();

    if (center) {
      mapRef.current?.setCenter([center.longitude, center.latitude]);
    } else if (devices.length > 0) {
      const positions = markersRef.current.map(m => m.getPosition()).filter(Boolean);
      if (positions.length > 0) {
        mapRef.current?.setFitView(positions, true, [60, 60, 60, 60]);
      }
    }
  }, [mapLoaded, devices, fences, center, updateDevices, updateFences]);

  return (
    <div id="map-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {mapError ? (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          zIndex: 10,
          flexDirection: 'column',
          padding: 20,
          textAlign: 'center'
        }}>
          <div style={{ color: '#f5222d', marginBottom: 16 }}>{mapError}</div>
          <Button type="primary" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      ) : !mapLoaded ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          background: '#f5f5f5',
          borderRadius: 4
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: '#666'
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: '3px solid #1890ff',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: 16
            }}></div>
            <div>地图加载中...</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StableAMap;
