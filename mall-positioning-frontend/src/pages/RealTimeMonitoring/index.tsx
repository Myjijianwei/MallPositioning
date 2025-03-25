import React, { useEffect, useRef, useState } from 'react';
import { Card, List, Spin, message } from 'antd';
import styles from './index.less';
import { useModel } from '@umijs/max';

interface LocationData {
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  createTime: string;  // 和后端字段保持一致
}

const RealTimeMonitoring = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const { initialState } = useModel('@@initialState');
  const { loginUser } = initialState || {};

  useEffect(() => {
    if (!loginUser?.id) {
      message.error('请先登录');
      return;
    }

    // 确保deviceId存在（根据你的业务逻辑获取）
    const deviceId = "default_device"; // 替换为实际获取逻辑
    const wsUrl = `ws://localhost:8001/api/gps-websocket?guardianId=${loginUser.id}&deviceId=${deviceId}`;

    console.log('Connecting to:', wsUrl); // 调试日志
    const ws = new WebSocket(wsUrl);

    wsRef.current = ws;

    ws.onopen = () => {
      setIsLoading(false);
      console.log('WebSocket连接成功');
      message.success('实时连接已建立');
    };

    ws.onmessage = (event) => {
      console.log('Received:', event.data); // 原始数据日志
      try {
        const data = JSON.parse(event.data);
        // 确保字段映射正确
        const location: LocationData = {
          deviceId: data.deviceId,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          accuracy: parseFloat(data.accuracy),
          createTime: data.createTime || new Date().toISOString()
        };

        setLocations(prev => {
          const existingIndex = prev.findIndex(item => item.deviceId === location.deviceId);
          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = location;
            return updated;
          }
          return [...prev, location];
        });
      } catch (error) {
        console.error('消息解析失败:', error, '原始数据:', event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
      message.error('连接错误，请刷新重试');
    };

    ws.onclose = () => {
      console.log('WebSocket关闭');
      message.warning('连接断开，5秒后重连...');
      setTimeout(() => {
        if (loginUser?.id) {
          wsRef.current = new WebSocket(wsUrl);
        }
      }, 5000);
    };

    return () => {
      wsRef.current?.close();
    };
  }, [loginUser?.id]); // 依赖项只有guardianId

  return (
    <div className={styles.realTimeMonitoring}>
      <Spin spinning={isLoading} tip="连接实时服务...">
        <List
          itemLayout="horizontal"
          dataSource={locations}
          renderItem={(item) => (
            <List.Item>
              <Card title={`设备 ${item.deviceId}`} bordered={false}>
                <div className={styles.locationInfo}>
                  <p>坐标：{item.latitude}, {item.longitude}</p>
                  <p>精度：{item.accuracy}米</p>
                  <p>更新时间：{new Date(item.createTime).toLocaleString()}</p>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Spin>
    </div>
  );
};

export default RealTimeMonitoring;
