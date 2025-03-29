import React, { useEffect, useState } from 'react';
import {
  AlertLevel,
  AlertStatus,
  AlertType,
  getAlertTypeText,
  getStatusByCode,
} from '@/constants/alerts';
import {
  batchUpdateAlertStatusUsingPost,
  deleteAlertUsingPost,
  listAlertsUsingGet,
  updateAlertStatusUsingPost,
} from '@/services/MapBackend/alertController';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  FilterOutlined,
  MoreOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PageContainer, StatisticCard } from '@ant-design/pro-components';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Divider,
  Dropdown,
  List,
  Menu,
  message,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useRequest } from 'umi';
import AlertStatistics from '@/components/Alert/AlertStatistics';
import AlertDetailDrawer from '@/components/Alert/AlertDetailDrawer';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Statistic } = StatisticCard;

interface AlertItem {
  id: string;
  deviceId?: string;
  deviceName: string;
  type: keyof typeof AlertType;
  message: string;
  triggeredAt: string;
  status: keyof typeof AlertStatus;
  level?: keyof typeof AlertLevel;
  fenceName?: string;
  latitude?: number;
  longitude?: number;
}

interface ListResponse {
  records: AlertItem[];
  total: string;
  size: string;
  current: string;
}

const AlarmList: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<AlertItem | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [params, setParams] = useState({
    status: 'UNRESOLVED' as keyof typeof AlertStatus,
    type: undefined as keyof typeof AlertType | undefined,
    level: undefined as keyof typeof AlertLevel | undefined,
    startTime: undefined as string | undefined,
    endTime: undefined as string | undefined,
    pageSize: 10,
    current: 1,
  });

  // 使用useRequest管理数据请求
  const {
    data: alertData,
    loading,
    run: fetchAlerts,
    refresh,
  } = useRequest(
    () =>
      listAlertsUsingGet({
        ...params,
        current: undefined,
        page: params.current,
      }),
    {
      manual: true,
      formatResult: (res: { data: ListResponse }) => ({
        ...res,
        data: {
          ...res.data,
          total: parseInt(res.data?.total) || 0,
        },
      }),
      onError: () => message.error('获取警报列表失败'),
    },
  );

  const alerts: AlertItem[] = alertData?.data?.records || [];
  const total: number = alertData?.data?.total || 0;

  // 加载数据
  useEffect(() => {
    fetchAlerts();
  }, [params]);

  // 统计未解决警报数量
  const unresolvedCount = alerts.filter(
    (a) => a.status === 'UNRESOLVED',
  ).length;

  // 处理状态变更
  const handleStatusChange = async (id: string, status: keyof typeof AlertStatus) => {
    try {
      const response = await updateAlertStatusUsingPost({
        ids: [id],
        status: status
      });

      if (response.code === 0) {
        message.success('状态更新成功');
        refresh();
      } else {
        message.error(response.message || '状态更新失败');
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      message.error('状态更新失败');
    }
  };

  // 批量处理警报
  const handleBatchAction = async (status: keyof typeof AlertStatus) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一条警报');
      return;
    }

    try {
      const response = await batchUpdateAlertStatusUsingPost({
        ids: selectedRowKeys,
        status: status
      });

      if (response.code === 0) {
        message.success(`已批量${getStatusByCode(status).text} ${selectedRowKeys.length}条警报`);
        setSelectedRowKeys([]);
        refresh();
      } else {
        message.error(response.message || '批量操作失败');
      }
    } catch (error) {
      console.error('批量操作失败:', error);
      message.error('批量操作失败');
    }
  };

  // 删除警报
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteAlertUsingPost({ id });
      if (response.code === 0) {
        message.success('删除成功');
        refresh();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 操作菜单
  const renderActions = (alert: AlertItem) => (
    <Dropdown
      overlay={
        <Menu>
          {alert.status !== 'RESOLVED' && (
            <Menu.Item
              key="resolve"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(alert.id, 'RESOLVED')}
            >
              标记为已解决
            </Menu.Item>
          )}
          {alert.status !== 'IGNORED' && (
            <Menu.Item
              key="ignore"
              icon={<CloseCircleOutlined />}
              onClick={() => handleStatusChange(alert.id, 'IGNORED')}
            >
              标记为已忽略
            </Menu.Item>
          )}
          <Menu.Item
            key="delete"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(alert.id)}
            danger
          >
            删除记录
          </Menu.Item>
        </Menu>
      }
    >
      <Button type="text" icon={<MoreOutlined />} />
    </Dropdown>
  );

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
    getCheckboxProps: (record: AlertItem) => ({
      disabled: record.status === 'DELETED',
    }),
  };

  // 渲染列表项前面的复选框
  const renderCheckbox = (alert: AlertItem) => (
    <Checkbox
      checked={selectedRowKeys.includes(alert.id)}
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedRowKeys([...selectedRowKeys, alert.id]);
        } else {
          setSelectedRowKeys(selectedRowKeys.filter(key => key !== alert.id));
        }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );

  // 筛选面板
  const renderFilterPanel = () => (
    <Card bordered={false} style={{ marginBottom: 16 }}>
      <Space size="middle">
        <Select
          placeholder="状态筛选"
          style={{ width: 150 }}
          value={params.status}
          onChange={(status) => setParams({ ...params, status, current: 1 })}
          allowClear
        >
          {Object.entries(AlertStatus).map(([key, value]) => (
            <Option key={key} value={key}>
              {value.text}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="类型筛选"
          style={{ width: 150 }}
          value={params.type}
          onChange={(type) => setParams({ ...params, type, current: 1 })}
          allowClear
        >
          {Object.entries(AlertType).map(([key, value]) => (
            <Option key={key} value={key}>
              {value}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="级别筛选"
          style={{ width: 150 }}
          value={params.level}
          onChange={(level) => setParams({ ...params, level, current: 1 })}
          allowClear
        >
          {Object.entries(AlertLevel).map(([key, value]) => (
            <Option key={key} value={key}>
              {value.text}
            </Option>
          ))}
        </Select>

        <RangePicker
          showTime
          style={{ width: 350 }}
          onChange={(dates) =>
            setParams({
              ...params,
              startTime: dates?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
              endTime: dates?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
              current: 1,
            })
          }
        />

        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setParams({
              status: 'UNRESOLVED',
              type: undefined,
              level: undefined,
              startTime: undefined,
              endTime: undefined,
              pageSize: 10,
              current: 1,
            });
            setSelectedRowKeys([]);
          }}
        >
          重置
        </Button>
      </Space>
    </Card>
  );

  // 统计数据卡片
  const renderStatsCard = () => (
    <StatisticCard.Group>
      <StatisticCard
        statistic={{
          title: '总警报数',
          value: total,
        }}
      />
      <StatisticCard
        statistic={{
          title: '未解决',
          value: unresolvedCount,
          status: 'error',
        }}
      />
      <StatisticCard
        statistic={{
          title: '已解决',
          value: alerts.filter((a) => a.status === 'RESOLVED').length,
          status: 'success',
        }}
      />
      <StatisticCard
        statistic={{
          title: '已忽略',
          value: alerts.filter((a) => a.status === 'IGNORED').length,
          status: 'default',
        }}
      />
    </StatisticCard.Group>
  );

  return (
    <PageContainer
      title={
        <Space>
          警报历史记录
          {unresolvedCount > 0 && <Badge count={unresolvedCount} />}
        </Space>
      }
      extra={[
        <Button
          key="statistics"
          icon={<BarChartOutlined />}
          onClick={() => setShowStatistics(!showStatistics)}
        >
          {showStatistics ? '隐藏统计' : '查看统计'}
        </Button>,
        <Button
          key="filter"
          icon={<FilterOutlined />}
          onClick={() =>
            setParams({
              ...params,
              status: params.status === 'UNRESOLVED' ? undefined : 'UNRESOLVED',
            })
          }
        >
          {params.status === 'UNRESOLVED' ? '显示全部' : '仅显示未解决'}
        </Button>,
      ]}
    >
      {renderFilterPanel()}

      {showStatistics && (
        <>
          {renderStatsCard()}
          <AlertStatistics alerts={alerts} />
          <Divider />
        </>
      )}

      <Card bordered={false}>
        <Spin spinning={loading}>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleBatchAction('RESOLVED')}
                disabled={selectedRowKeys.length === 0}
              >
                批量解决
              </Button>
              <Button
                icon={<CloseCircleOutlined />}
                onClick={() => handleBatchAction('IGNORED')}
                disabled={selectedRowKeys.length === 0}
              >
                批量忽略
              </Button>
              <Popconfirm
                title="确定要删除这些警报吗？"
                onConfirm={() => handleBatchAction('DELETED')}
                okText="确定"
                cancelText="取消"
                disabled={selectedRowKeys.length === 0}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={selectedRowKeys.length === 0}
                >
                  批量删除
                </Button>
              </Popconfirm>
              <span style={{ marginLeft: 8 }}>
                {selectedRowKeys.length > 0 ? `已选择 ${selectedRowKeys.length} 项` : '请选择警报进行操作'}
              </span>
            </Space>
          </div>

          <List
            dataSource={alerts}
            rowKey="id"
            pagination={{
              current: params.current,
              pageSize: params.pageSize,
              total,
              onChange: (page, pageSize) =>
                setParams({ ...params, current: page, pageSize }),
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            renderItem={(alert) => (
              <List.Item
                actions={[renderActions(alert)]}
                style={{ cursor: 'pointer', padding: '12px 16px' }}
                onClick={() => {
                  setCurrentAlert(alert);
                  setDetailVisible(true);
                }}
              >
                <List.Item.Meta
                  avatar={renderCheckbox(alert)}
                  title={
                    <Space>
                      <Tag color={getStatusByCode(alert.status).color}>
                        {getStatusByCode(alert.status).text}
                      </Tag>
                      <span style={{ fontWeight: 500 }}>{alert.message}</span>
                      <Tag
                        color={
                          alert.level === 'HIGH'
                            ? 'red'
                            : alert.level === 'MEDIUM'
                              ? 'orange'
                              : 'blue'
                        }
                      >
                        {getAlertTypeText(alert.type)}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <span>
                        {alert.deviceName || '未知设备'} - {alert.fenceName || '未知围栏'}
                      </span>
                      <span style={{ color: '#999', fontSize: 12 }}>
                        {dayjs(alert.triggeredAt).format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Spin>
      </Card>

      <AlertDetailDrawer
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        alert={currentAlert}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </PageContainer>
  );
};

export default AlarmList;
