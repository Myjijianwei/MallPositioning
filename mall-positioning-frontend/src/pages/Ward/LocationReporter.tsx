import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Spin, message, Card, Typography, Alert, Row, Col, Statistic, Progress } from 'antd';
import {
  RadarChartOutlined,
  PoweroffOutlined,
  SendOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  AimOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useModel } from 'umi';
import { reportLocationUsingPost } from '@/services/MapBackend/locationDataController';
import styled from 'styled-components';

const { Title, Text } = Typography;

const LocationCard = styled(Card)`
  margin-bottom: 16px;
`;

const StatusIndicator = styled.div<{ $active: boolean }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: ${props => props.$active ? '#52c41a' : '#f5222d'};
`;

const LocationReporter = () => {
  const { initialState } = useModel('@@initialState');
  const { loginUser } = initialState || {};
  const wardId = loginUser?.id;

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [reportCount, setReportCount] = useState(0);
  const [accuracyLevel, setAccuracyLevel] = useState<'high' | 'medium' | 'low'>('high');
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  // 清理函数
  const cleanup = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    retryCountRef.current = 0;
  }, [intervalId]);

  // 上报位置到服务器
  const reportLocation = useCallback(async (pos: GeolocationPosition) => {
    if (!wardId) {
      setError('未获取到用户ID');
      return;
    }

    try {
      setLoading(true);
      const response = await reportLocationUsingPost({
        wardId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp
      });

      if (response.code === 0) {
        setReportCount(prev => prev + 1);
        setPosition(pos);
        lastPositionRef.current = pos;
        setError(null);
        retryCountRef.current = 0;
      } else {
        throw new Error(response.message || '上报失败');
      }
    } catch (err) {
      console.error('位置上报失败:', err);
      setError(err.message || '位置上报失败');
      message.error('位置上报失败');
    } finally {
      setLoading(false);
    }
  }, [wardId]);

  // 处理位置更新
  const handlePositionUpdate = useCallback((pos: GeolocationPosition) => {
    if (lastPositionRef.current) {
      const distance = calculateDistance(
        lastPositionRef.current.coords.latitude,
        lastPositionRef.current.coords.longitude,
        pos.coords.latitude,
        pos.coords.longitude
      );

      if (distance < 5 && pos.coords.accuracy >= (lastPositionRef.current.coords.accuracy || 50)) {
        return;
      }
    }
    reportLocation(pos);
  }, [reportLocation]);

  // 启动位置监控
  const startReporting = useCallback(() => {
    if (!navigator.geolocation) {
      setError('您的浏览器不支持地理位置功能');
      return;
    }

    cleanup();
    setIsActive(true);
    setError(null);
    retryCountRef.current = 0;

    const tryGetPosition = () => {
      const currentAccuracy = adjustAccuracyLevel(retryCountRef.current);
      setAccuracyLevel(currentAccuracy);
      const options = getGeoOptions(currentAccuracy);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          reportLocation(pos);
          watchIdRef.current = navigator.geolocation.watchPosition(
            handlePositionUpdate,
            (err) => {
              console.error('监控位置失败:', err);
              setError(`获取位置失败: ${err.message}`);
              retryCountRef.current += 1;
            },
            options
          );
        },
        (err) => {
          console.error('获取位置失败:', err);
          setError(`获取位置失败: ${err.message}`);
          retryCountRef.current += 1;

          if (retryCountRef.current < 3) {
            setTimeout(tryGetPosition, 2000 * retryCountRef.current);
          } else {
            setIsActive(false);
            setError('无法获取位置，请检查位置服务是否开启');
          }
        },
        options
      );
    };

    tryGetPosition();

    const id = setInterval(() => {
      if (lastPositionRef.current) {
        reportLocation(lastPositionRef.current);
      }
    }, 30000);

    setIntervalId(id);
  }, [cleanup, handlePositionUpdate, reportLocation]);

  // 停止位置监控
  const stopReporting = useCallback(() => {
    cleanup();
    setIsActive(false);
    setError(null);
  }, [cleanup]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // 计算两点之间的距离（米）
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // 调整定位精度级别
  const adjustAccuracyLevel = useCallback((errorCount: number): 'high' | 'medium' | 'low' => {
    if (errorCount >= 3) return 'low';
    if (errorCount >= 1) return 'medium';
    return 'high';
  }, []);

  // 获取定位选项
  const getGeoOptions = useCallback((level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 };
      case 'medium':
        return { enableHighAccuracy: false, maximumAge: 10000, timeout: 15000 };
      case 'low':
        return { enableHighAccuracy: false, maximumAge: 30000, timeout: 20000 };
    }
  }, []);

  return (
    <Card title="位置上报系统" style={{ maxWidth: 800, margin: '20px auto' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <LocationCard
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <StatusIndicator $active={isActive} />
                <Text strong style={{ marginLeft: 8 }}>
                  {isActive ? '运行中' : '已停止'}
                </Text>
              </div>
            }
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="上报状态"
                  value={isActive ? '运行中' : '已停止'}
                  prefix={isActive ? <RadarChartOutlined /> : <PoweroffOutlined />}
                  valueStyle={{ color: isActive ? '#52c41a' : '#f5222f' }}
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
                  value={accuracyLevel === 'high' ? '高精度' : accuracyLevel === 'medium' ? '中精度' : '低精度'}
                  prefix={<AimOutlined />}
                />
              </Col>
            </Row>
          </LocationCard>
        </Col>

        {position && (
          <Col span={24}>
            <LocationCard title="当前位置信息">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong><EnvironmentOutlined style={{ marginRight: 8 }} />坐标信息</Text>
                    <div style={{ marginTop: 8 }}>
                      <Text>纬度: {position.coords.latitude.toFixed(6)}</Text>
                      <br />
                      <Text>经度: {position.coords.longitude.toFixed(6)}</Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong><DashboardOutlined style={{ marginRight: 8 }} />精度信息</Text>
                    <div style={{ marginTop: 8 }}>
                      <Text>精确度: ±{position.coords.accuracy?.toFixed(1) || '未知'}米</Text>
                      <Progress
                        percent={Math.min(100, 100 - (position.coords.accuracy || 0))}
                        showInfo={false}
                        strokeColor={position.coords.accuracy <= 50 ? '#52c41a' : '#faad14'}
                      />
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <Text strong><ClockCircleOutlined style={{ marginRight: 8 }} />上报时间</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>{new Date(position.timestamp).toLocaleString()}</Text>
                  </div>
                </Col>
              </Row>
            </LocationCard>
          </Col>
        )}

        <Col span={24}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button
              type="primary"
              onClick={startReporting}
              disabled={isActive}
              loading={loading}
              icon={<RadarChartOutlined />}
            >
              开始上报
            </Button>
            <Button
              danger
              onClick={stopReporting}
              disabled={!isActive}
              icon={<PoweroffOutlined />}
            >
              停止上报
            </Button>
            {isActive && (
              <Button
                onClick={() => lastPositionRef.current && reportLocation(lastPositionRef.current)}
                loading={loading}
                icon={<SendOutlined />}
              >
                立即上报
              </Button>
            )}
          </div>
        </Col>

        {error && (
          <Col span={24}>
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default LocationReporter;
