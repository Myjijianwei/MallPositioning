import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Card, Typography, Alert, Row, Col, Statistic, Progress, message, Spin } from 'antd';
import { RadarChartOutlined, PoweroffOutlined, SendOutlined, EnvironmentOutlined, AimOutlined } from '@ant-design/icons';
import { useModel } from 'umi';
import { reportLocationUsingPost } from '@/services/MapBackend/locationDataController';
import styled from 'styled-components';
import { transform, WGS84, GCJ02 } from 'gcoord';

const { Text } = Typography;

// --- 优化样式 ---
const LocationCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
`;

const LocationReporter: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const { loginUser } = initialState || {};
  const wardId = loginUser?.id;

  // 状态管理
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [convertedPos, setConvertedPos] = useState<{ lng: number; lat: number; accuracy?: number } | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState({ main: false, immediate: false });
  const [error, setError] = useState<string | null>(null);
  const [reportCount, setReportCount] = useState(0);

  // 定位优化参数
  const positionHistory = useRef<{
    pos: GeolocationPosition;
    timestamp: number;
  }[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fastPositionRef = useRef<GeolocationPosition | null>(null);

  // 清理资源
  const cleanup = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    positionHistory.current = [];
  }, []);

  // 快速获取定位（不等待高精度）
  const getFastPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { enableHighAccuracy: false, maximumAge: 5000, timeout: 5000 }
      );
    });
  }, []);

  // 高精度定位（带超时）
  const getAccuratePosition = useCallback(async (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('定位超时，使用最后已知位置'));
      }, 8000); // 8秒超时

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve(pos);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    });
  }, []);

  // 坐标转换
  const convertCoordinates = useCallback((pos: GeolocationPosition) => {
    try {
      const result = transform(
        [pos.coords.longitude, pos.coords.latitude],
        WGS84,
        GCJ02
      );
      return {
        lng: result[0],
        lat: result[1],
        accuracy: pos.coords.accuracy
      };
    } catch (err) {
      return {
        lng: pos.coords.longitude,
        lat: pos.coords.latitude,
        accuracy: pos.coords.accuracy
      };
    }
  }, []);

  // 智能定位策略
  const getSmartPosition = useCallback(async (): Promise<GeolocationPosition> => {
    try {
      // 1. 先快速获取一个粗略位置
      const fastPos = await getFastPosition();
      fastPositionRef.current = fastPos;

      // 2. 同时尝试获取高精度位置（不阻塞UI）
      getAccuratePosition()
        .then(accuratePos => {
          if (accuratePos.coords.accuracy < (fastPos.coords.accuracy || 100)) {
            fastPositionRef.current = accuratePos;
            updatePosition(accuratePos);
          }
        })
        .catch(() => {}); // 静默失败

      return fastPos;
    } catch (err) {
      throw new Error('获取定位失败: ' + err.message);
    }
  }, [getFastPosition, getAccuratePosition]);

  // 更新位置数据
  const updatePosition = useCallback((pos: GeolocationPosition) => {
    const converted = convertCoordinates(pos);
    setPosition(pos);
    setConvertedPos(converted);

    // 记录位置历史（最多5个）
    positionHistory.current = [
      ...positionHistory.current.slice(-4),
      { pos, timestamp: Date.now() }
    ];
  }, [convertCoordinates]);

  // 上报位置到服务器
  const reportLocation = useCallback(async (pos: GeolocationPosition) => {
    if (!wardId) {
      setError('未获取到用户ID');
      return false;
    }

    setLoading(prev => ({ ...prev, main: true }));
    try {
      const converted = convertCoordinates(pos);
      const response = await reportLocationUsingPost({
        wardId,
        longitude: converted.lng,
        latitude: converted.lat,
        accuracy: converted.accuracy,
        timestamp: pos.timestamp,
        coordinateType: 'GCJ-02'
      });

      if (response.code === 0) {
        updatePosition(pos);
        setReportCount(prev => prev + 1);
        setError(null);
        return true;
      }
      throw new Error(response.message || '上报失败');
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(prev => ({ ...prev, main: false }));
    }
  }, [wardId, convertCoordinates, updatePosition]);

  // 立即上报（带优化）
  const reportImmediately = useCallback(async () => {
    if (!isActive) {
      message.warning('请先开启持续上报');
      return;
    }

    setLoading(prev => ({ ...prev, immediate: true }));
    try {
      // 优先使用最近的高精度位置
      const accuratePos = await getAccuratePosition().catch(() => {
        return fastPositionRef.current || positionHistory.current[0]?.pos;
      });

      if (accuratePos) {
        await reportLocation(accuratePos);
        message.success('位置上报成功');
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(prev => ({ ...prev, immediate: false }));
    }
  }, [isActive, reportLocation]);

  // 启动持续上报
  const startReporting = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('浏览器不支持定位功能');
      return;
    }

    cleanup();
    setIsActive(true);
    setError(null);

    try {
      // 首次快速定位
      const initialPos = await getSmartPosition();
      await reportLocation(initialPos);

      // 持续监听位置变化
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          // 只有当精度提升或位置变化较大时才更新
          const lastPos = positionHistory.current[positionHistory.current.length - 1]?.pos;
          if (!lastPos ||
            pos.coords.accuracy < lastPos.coords.accuracy ||
            calculateDistance(pos, lastPos) > 10) {
            updatePosition(pos);
          }
        },
        (err) => setError(err.message),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );

      // 定时强制上报（30秒）
      intervalRef.current = setInterval(async () => {
        if (positionHistory.current.length > 0) {
          const lastPos = positionHistory.current[positionHistory.current.length - 1].pos;
          await reportLocation(lastPos);
        }
      }, 30000);
    } catch (err) {
      setError(err.message);
      setIsActive(false);
    }
  }, [cleanup, getSmartPosition, reportLocation, updatePosition]);

  // 计算两点间距离（米）
  const calculateDistance = (pos1: GeolocationPosition, pos2: GeolocationPosition) => {
    const lat1 = pos1.coords.latitude;
    const lon1 = pos1.coords.longitude;
    const lat2 = pos2.coords.latitude;
    const lon2 = pos2.coords.longitude;

    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // 停止上报
  const stopReporting = useCallback(() => {
    cleanup();
    setIsActive(false);
  }, [cleanup]);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <Card
      title="精准位置上报系统（优化版）"
      style={{ maxWidth: 800, margin: '20px auto' }}
      headStyle={{ fontSize: '18px', fontWeight: 'bold' }}
    >
      <Row gutter={[16, 16]}>
        {/* 状态卡片 */}
        <Col span={24}>
          <LocationCard>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="系统状态"
                  value={isActive ? '运行中' : '已停止'}
                  prefix={isActive ?
                    <RadarChartOutlined style={{ color: '#52c41a' }} /> :
                    <PoweroffOutlined style={{ color: '#f5222d' }} />}
                  valueStyle={{ color: isActive ? '#52c41a' : '#f5222d' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="上报次数"
                  value={reportCount}
                  prefix={<SendOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="定位精度"
                  value={position?.coords.accuracy ?
                    `±${Math.min(100, position.coords.accuracy).toFixed(1)}米` : '--'}
                  prefix={<AimOutlined />}
                />
              </Col>
            </Row>
          </LocationCard>
        </Col>

        {/* 坐标信息 */}
        {position && convertedPos && (
          <Col span={24}>
            <LocationCard title={
              <div>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                最新坐标（GCJ-02）
              </div>
            }>
              <Row gutter={16}>
                <Col span={24}>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block' }}>经度</Text>
                    <Text copyable code>{convertedPos.lng.toFixed(6)}</Text>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block' }}>纬度</Text>
                    <Text copyable code>{convertedPos.lat.toFixed(6)}</Text>
                  </div>
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>定位精度</Text>
                    <Progress
                      percent={Math.min(100, 100 - (position.coords.accuracy || 0))}
                      status={
                        position.coords.accuracy <= 20 ? 'success' :
                          position.coords.accuracy <= 50 ? 'normal' : 'exception'
                      }
                      strokeColor={{
                        from: '#108ee9',
                        to: '#87d068'
                      }}
                      format={() => `±${position.coords.accuracy?.toFixed(1)}米`}
                    />
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      更新时间: {new Date(position.timestamp).toLocaleTimeString()}
                    </Text>
                  </div>
                </Col>
              </Row>
            </LocationCard>
          </Col>
        )}

        {/* 控制按钮 */}
        <Col span={24}>
          <div style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Button
              type="primary"
              size="large"
              onClick={startReporting}
              disabled={isActive}
              loading={loading.main}
              icon={<RadarChartOutlined />}
              style={{ minWidth: 140 }}
            >
              {isActive ? '运行中' : '开始上报'}
            </Button>
            <Button
              danger
              size="large"
              onClick={stopReporting}
              disabled={!isActive}
              icon={<PoweroffOutlined />}
              style={{ minWidth: 140 }}
            >
              停止上报
            </Button>
            <Button
              size="large"
              onClick={reportImmediately}
              disabled={!isActive}
              loading={loading.immediate}
              icon={<AimOutlined />}
              style={{ minWidth: 140 }}
            >
              精准上报
            </Button>
          </div>
        </Col>

        {/* 使用提示 */}
        <Col span={24}>
          <Alert
            message="定位优化说明"
            description={
              <ul style={{ marginBottom: 0 }}>
                <li>• <strong>开始上报</strong>：快速启动，先显示粗略位置再逐步优化</li>
                <li>• <strong>精准上报</strong>：获取当前最高精度位置（可能需要3-8秒）</li>
                <li>• 系统会自动持续优化定位精度</li>
                <li>• 在开阔区域使用可获得最佳效果</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Col>

        {/* 错误提示 */}
        {error && (
          <Col span={24}>
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
              style={{ marginTop: 16 }}
            />
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default LocationReporter;
