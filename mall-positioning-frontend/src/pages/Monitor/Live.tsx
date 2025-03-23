import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Typography, Space, Select, Button } from 'antd';
import styled from 'styled-components';
import { getWardByGidUsingPost } from '@/services/MapBackend/userController';
import AMapComponent from '@/components/Map/AMapComponent';

const { Text } = Typography;
const { Option } = Select;

// 使用 styled-components 增加样式
const LocationCard = styled(Card)`
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
`;

// 定义被监护人位置数据结构
interface GuardianLocation {
  monitorId: string;
  longitude: number;
  latitude: number;
}

const Live = () => {
  const [guardianLocations, setGuardianLocations] = useState<GuardianLocation[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(null); // 当前选中的被监护人ID
  const [showAll, setShowAll] = useState<boolean>(false); // 是否显示所有被监护人
  const [guardianList, setGuardianList] = useState<{ id: string; name: string }[]>([]); // 被监护人列表
  const [currentLocation, setCurrentLocation] = useState<{ longitude: number; latitude: number } | null>(null); // 当前用户位置

  // 从后端获取被监护人列表
  useEffect(() => {
    const fetchGuardianList = async () => {
      try {
        const response = await getWardByGidUsingPost({
          guardianId: '5', // 替换为实际的监护人ID
        });
        if (response.code === 0) {
          setGuardianList(response.data); // 设置被监护人列表
        } else {
          console.error('获取被监护人列表失败', response.message);
        }
      } catch (error) {
        console.error('获取被监护人列表失败', error);
      }
    };

    fetchGuardianList();
  }, []);

  // 获取用户当前位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setCurrentLocation({ longitude, latitude });
          console.log('用户当前位置：', { longitude, latitude });
        },
        (error) => {
          console.error('获取用户位置失败', error);
        },
        {
          enableHighAccuracy: true, // 启用高精度模式
          timeout: 10000, // 超时时间设置为 10 秒
          maximumAge: 0, // 不使用缓存
        }
      );
    } else {
      console.error('浏览器不支持 Geolocation API');
    }
  }, []);

  // 连接WebSocket
  useEffect(() => {
    const guardianId = '5'; // 从实际场景获取监护人ID
    const socketUrl = `ws://localhost:8001/api/gps-websocket?guardianId=${guardianId}`;
    const newSocket = new WebSocket(socketUrl);

    newSocket.onopen = () => {
      console.log('WebSocket连接成功');
      // 发送用户当前位置
      if (currentLocation) {
        newSocket.send(JSON.stringify(currentLocation));
      }
    };

    newSocket.onmessage = (event) => {
      try {
        const gpsData: GuardianLocation = JSON.parse(event.data);
        setGuardianLocations((prevLocations) => {
          const index = prevLocations.findIndex((loc) => loc.monitorId === gpsData.monitorId);
          if (index !== -1) {
            prevLocations[index] = gpsData;
          } else {
            prevLocations.push(gpsData);
          }
          return [...prevLocations];
        });
      } catch (error) {
        console.error('解析WebSocket数据出错', error);
      }
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket连接错误', error);
    };

    newSocket.onclose = (event) => {
      console.log('WebSocket连接关闭', event);
    };

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [currentLocation]); // 依赖 currentLocation，确保位置更新后重新连接

  return (
    <PageContainer>
      <AMapComponent
        locations={guardianLocations}
        selectedMonitorId={selectedMonitorId}
        showAll={showAll}
        currentLocation={currentLocation}
      />
      <LocationCard>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>被监护人位置信息</Text>
          <Select
            placeholder="选择被监护人"
            style={{ width: '100%', marginBottom: 16 }}
            onChange={(value) => setSelectedMonitorId(value)}
          >
            {guardianList.map((guardian) => (
              <Option key={guardian.id} value={guardian.id}>
                {guardian.name} (ID: {guardian.id})
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            onClick={() => setShowAll(!showAll)}
            style={{ width: '100%' }}
          >
            {showAll ? '显示单个' : '显示所有'}
          </Button>
          {guardianLocations.map((loc) => (
            <React.Fragment key={loc.monitorId}>
              <Text>被监护人ID: {loc.monitorId}</Text>
              <Text>经度: {loc.longitude}</Text>
              <Text>纬度: {loc.latitude}</Text>
            </React.Fragment>
          ))}
        </Space>
      </LocationCard>
    </PageContainer>
  );
};

export default Live;
