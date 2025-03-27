import React, { useState } from 'react';
import { Button, message } from 'antd';

import { Amap, AmapPolygon } from '@amap/amap-react';

// 假设 API 是一个已经定义好的命名空间
// 如果不是，需要确保正确引入
// 这里暂时忽略类型检查
interface API {
  GeoFence: {
    id: string;
    coordinates: string;
  };
}

interface FenceMapProps {
  deviceId?: string;
  fences: API.GeoFence[];
  onCreate: (coordinates: [number, number][]) => void;
}

const FenceMap: React.FC<FenceMapProps> = ({ fences, onCreate }) => {
  const [drawing, setDrawing] = useState(false);
  const [polygonPath, setPolygonPath] = useState<[number, number][]>([]);

  const toggleDrawing = () => {
    setDrawing(!drawing);
    if (!drawing) {
      setPolygonPath([]);
    }
  };

  const handleMapClick = (e: any) => {
    if (!drawing) return;
    setPolygonPath(prev => [...prev, [e.lnglat.lng, e.lnglat.lat]]);
  };

  const confirmDraw = () => {
    if (polygonPath.length < 3) {
      message.warning('至少需要3个点才能创建围栏');
      return;
    }
    onCreate(polygonPath);
    setDrawing(false);
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* 确保 Amap 组件存在且可用 */}
      {Amap && (
        <Amap zoom={15} onClick={handleMapClick}>
          {/* 显示已有围栏 */}
          {fences && fences.map(fence => (
            <AmapPolygon
              key={fence.id}
              path={JSON.parse(fence.coordinates as string)}
              strokeColor="#FF0000"
              strokeOpacity={0.8}
              strokeWeight={2}
              fillColor="#FF000040"
            />
          ))}

          {/* 正在绘制的围栏 */}
          {drawing && polygonPath.length > 0 && (
            <AmapPolygon
              path={polygonPath}
              strokeColor="#1890ff"
              strokeOpacity={1}
              strokeWeight={3}
              fillColor="#1890ff40"
            />
          )}
        </Amap>
      )}

      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 100 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button
            type={drawing ? 'primary' : 'default'}
            onClick={toggleDrawing}
          >
            {drawing ? '取消绘制' : '新建围栏'}
          </Button>
          {drawing && polygonPath.length > 0 && (
            <Button type="primary" onClick={confirmDraw}>
              完成绘制 ({polygonPath.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FenceMap;
