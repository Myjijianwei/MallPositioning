import React, { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader'; // 引入高德地图 SDK
import styled from 'styled-components';

// 定义被监护人位置数据结构
interface GuardianLocation {
  monitorId: string;
  longitude: number;
  latitude: number;
}

interface AMapComponentProps {
  locations: GuardianLocation[];
  selectedMonitorId: string | null;
  showAll: boolean;
  currentLocation: { longitude: number; latitude: number } | null; // 当前用户位置
}

// 使用 styled-components 增加样式
const MapContainer = styled.div`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 24px;
`;

const AMapComponent: React.FC<AMapComponentProps> = ({ locations, selectedMonitorId, showAll, currentLocation }) => {
  const mapRef = useRef<any>(null); // 用于保存地图实例
  const markersRef = useRef<any[]>([]); // 用于保存多个Marker实例

  useEffect(() => {
    // 加载高德地图 SDK
    AMapLoader.load({
      key: '1170acb8a7694eab86d82b306f5f5bd2', // 替换为你的高德地图 Key
      version: '2.0', // 指定 SDK 版本
      plugins: ['AMap.Geolocation'], // 需要使用的插件
    })
      .then((AMap) => {
        // 初始化地图
        const map = new AMap.Map('map-container', {
          zoom: 15,
          center: currentLocation
            ? [currentLocation.longitude, currentLocation.latitude] // 使用当前用户位置作为中心点
            : [116.397428, 39.90923], // 默认中心点
        });
        mapRef.current = map;

        // 添加工具栏
        AMap.plugin('AMap.ToolBar', () => {
          const toolbar = new AMap.ToolBar();
          map.addControl(toolbar);
        });

        // 更新或添加标记
        const updateMarkers = () => {
          locations.forEach((loc) => {
            const markerIndex = markersRef.current.findIndex(
              (marker) => marker.monitorId === loc.monitorId
            );
            if (markerIndex !== -1) {
              const marker = markersRef.current[markerIndex].marker;
              marker.setPosition([loc.longitude, loc.latitude]);
            } else {
              const newMarker = new AMap.Marker({
                position: [loc.longitude, loc.latitude], // 使用经纬度
                map: map,
              });
              markersRef.current.push({ monitorId: loc.monitorId, marker: newMarker });
            }
          });

          // 如果选择单个被监护人，移动地图中心点
          if (selectedMonitorId && !showAll) {
            const selectedLocation = locations.find((loc) => loc.monitorId === selectedMonitorId);
            if (selectedLocation) {
              map.setCenter([selectedLocation.longitude, selectedLocation.latitude]);
            }
          }
        };

        updateMarkers();
      })
      .catch((error) => {
        console.error('加载高德地图失败：', error);
      });

    // 清理函数
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy(); // 销毁地图实例
      }
      markersRef.current.forEach((markerObj) => {
        if (markerObj.marker) {
          markerObj.marker.setMap(null);
        }
      });
    };
  }, [locations, selectedMonitorId, showAll, currentLocation]);

  return (
    <MapContainer>
      <div id="map-container" style={{ width: '100%', height: '666px', borderRadius: '16px', overflow: 'hidden' }} />
    </MapContainer>
  );
};

export default AMapComponent;
