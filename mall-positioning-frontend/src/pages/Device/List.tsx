import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Button,
  message,
  Tag,
  Spin,
  Alert,
  Typography,
  Modal,
  Form,
  Select,
  Card,
} from 'antd';
import { SearchOutlined, EditOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import {
  getDeviceByIdUsingGet,
  getWardDeviceUsingGet,
  getGuardianDevicesUsingGet
} from '@/services/MapBackend/deviceController';
import { useModel } from '@umijs/max';
import { history } from 'umi';
import { updateWardRelationshipUsingPost } from '@/services/MapBackend/wardController';

const { Text } = Typography;
const { Option } = Select;

// 定义扩展的设备类型
interface ExtendedDevice extends API.Device {
  guardianId?: string;
  relationship?: string;
  guardianName?: string;
}

interface RelationshipRecord {
  wardId: string;
  guardianId: string;
  relationship?: string;
  id?: string;
}

const List: React.FC = () => {
  const [myDevices, setMyDevices] = useState<API.Device[]>([]);
  const [wardDevices, setWardDevices] = useState<API.WardDeviceInfo[]>([]);
  const [guardianDevices, setGuardianDevices] = useState<ExtendedDevice[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<RelationshipRecord | null>(null);
  const [form] = Form.useForm();
  const { initialState } = useModel('@@initialState');
  const { loginUser } = initialState || {};

  // 获取设备列表
  useEffect(() => {
    const fetchDeviceList = async () => {
      if (!loginUser?.id) return;

      setLoading(true);
      setError(null);

      try {
        // 获取自己的设备
        const myDeviceResponse = await getDeviceByIdUsingGet({
          // @ts-ignore
          guardianId: loginUser.id
        });

        if (myDeviceResponse.code === 0 && myDeviceResponse.data) {
          setMyDevices([{
            ...myDeviceResponse.data,
            // @ts-ignore
            guardianName: loginUser.userName
          }]);
        } else if (myDeviceResponse.code !== 0) {
          message.warning(myDeviceResponse.message || '您尚未绑定设备');
        }

        // 根据角色获取不同数据
        if (loginUser.userRole === 'guardian') {
          // 监护人获取监护的设备
          const wardDeviceResponse = await getWardDeviceUsingGet({
            // @ts-ignore
            guardianId: loginUser.id
          });

          if (wardDeviceResponse.code === 0 && wardDeviceResponse.data) {
            setWardDevices(wardDeviceResponse.data || []);
          }
        } else if (loginUser.userRole === 'ward') {
          // 被监护人获取监护人设备
          const guardianDeviceResponse = await getGuardianDevicesUsingGet({
            wardId: loginUser.id
          });

          if (guardianDeviceResponse.code === 0 && guardianDeviceResponse.data) {
            // 转换数据，添加guardianId和relationship
            const enhancedDevices = guardianDeviceResponse.data.map(device => ({
              ...device,
              guardianId: device.user_id?.toString(),
              relationship: device.relationship || '未设置'
            }));
            setGuardianDevices(enhancedDevices || []);
          }
        }
      } catch (err) {
        console.error('获取设备列表失败:', err);
        setError('获取设备列表失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceList();
  }, [loginUser]);

  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  // 过滤设备列表
  const filterDevices = (devices: Array<API.Device | API.WardDeviceInfo | ExtendedDevice>) => {
    if (!devices || !Array.isArray(devices)) return [];

    return devices.filter((device) => {
      if (!device) return false;

      const searchLower = searchValue.toLowerCase();
      return (
        (device.id && device.id.toString().toLowerCase().includes(searchLower)) ||
        (device.name && device.name.toLowerCase().includes(searchLower)) ||
        ('wardName' in device && device.wardName && device.wardName.toLowerCase().includes(searchLower)) ||
        ('guardianName' in device && device.guardianName && device.guardianName.toLowerCase().includes(searchLower))
      );
    });
  };

  // 保存关系修改
  const handleSaveRelationship = async () => {
    try {
      const values = await form.validateFields();
      if (!editingRecord) return;

      const response = await updateWardRelationshipUsingPost({
        wardId: editingRecord.wardId,
        guardianId: editingRecord.guardianId,
        relationship: values.relationship
      });

      if (response.code === 0) {
        message.success('关系更新成功');
        // 更新本地状态
        if (loginUser?.userRole === 'ward') {
          setGuardianDevices(prev => prev.map(item =>
            item.guardianId === editingRecord.guardianId ? { ...item, relationship: values.relationship } : item
          ));
        }
        setEditingRecord(null);
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (err) {
      console.error('更新关系失败:', err);
      message.error('更新关系失败');
    }
  };

  // 表格列定义
  const deviceColumns = [
    {
      title: '设备ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => text || '-'
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => text || '-'
    },
    {
      title: '绑定时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => text ? new Date(text).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: API.Device) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => history.push(`/device/detail/${record.id}`)}
        >
          管理
        </Button>
      ),
    },
  ];

  const wardDeviceColumns = [
    {
      title: '设备ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
      render: (text: string) => text || '-'
    },
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      key: 'deviceName',
      render: (text: string) => text || '-'
    },
    {
      title: '被监护人',
      dataIndex: 'wardName',
      key: 'wardName',
      render: (text: string) => text || '-'
    },
    {
      title: '关系',
      dataIndex: 'relationship',
      key: 'relationship',
      render: (text?: string) => <Tag color="blue">{text || '未设置'}</Tag>
    },
    {
      title: '绑定时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text?: string) => text ? new Date(text).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: API.WardDeviceInfo) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => history.push(`/monitor/live/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const guardianDeviceColumns = [
    {
      title: '设备ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => id || '-'
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => name || '-'
    },
    {
      title: '监护人ID',
      dataIndex: 'guardianId',
      key: 'guardianId',
      render: (id?: string) => id || '-'
    },
    {
      title: '关系',
      dataIndex: 'relationship',
      key: 'relationship',
      render: (text?: string) => <Tag color="blue">{text || '未设置'}</Tag>
    },
    {
      title: '绑定时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text?: string) => text ? new Date(text).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ExtendedDevice) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => {
            if (!loginUser?.id) return;

            setEditingRecord({
              wardId: loginUser.id.toString(),
              guardianId: record.guardianId || '',
              relationship: record.relationship
            });
            form.setFieldsValue({
              relationship: record.relationship || '未设置'
            });
          }}
        >
          编辑关系
        </Button>
      ),
    },
  ];

  const renderEmpty = (description: string) => (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <img
        src="/empty.svg"
        alt="empty"
        style={{ width: 80, height: 80, marginBottom: 16, opacity: 0.6 }}
      />
      <Text type="secondary">{description}</Text>
    </div>
  );

  if (error) {
    return <Alert type="error" message={error} showIcon style={{ margin: 24 }} />;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>
        <UserOutlined style={{ marginRight: 12 }} />
        设备管理
      </h1>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="搜索设备ID、名称或人员"
          value={searchValue}
          onChange={handleSearch}
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          allowClear
        />
        <Button
          type="primary"
          onClick={() => history.push('/device/bind')}
        >
          绑定新设备
        </Button>
      </div>

      <Spin spinning={loading}>
        {/* 我的设备 */}
        <Card
          title={<><Tag color="blue">我的设备</Tag></>}
          style={{ marginBottom: 24 }}
          bordered={false}
        >
          <Table
            dataSource={filterDevices(myDevices)}
            columns={deviceColumns}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: renderEmpty('您尚未绑定任何设备') }}
          />
        </Card>

        {/* 所监护的设备（仅监护人可见） */}
        {loginUser?.userRole === 'guardian' && (
          <Card
            title={<><Tag color="green">所监护的设备</Tag></>}
            style={{ marginBottom: 24 }}
            bordered={false}
          >
            <Table
              dataSource={filterDevices(wardDevices)}
              columns={wardDeviceColumns}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              locale={{ emptyText: renderEmpty('您当前没有监护任何设备') }}
            />
          </Card>
        )}

        {/* 监护人设备（仅被监护人可见） */}
        {loginUser?.userRole === 'ward' && (
          <Card
            title={<><Tag color="orange">我的监护人</Tag></>}
            bordered={false}
          >
            <Table
              dataSource={filterDevices(guardianDevices)}
              columns={guardianDeviceColumns}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              locale={{ emptyText: renderEmpty('您当前没有绑定任何监护人') }}
            />
          </Card>
        )}
      </Spin>

      {/* 编辑关系弹窗 */}
      <Modal
        title="编辑监护关系"
        open={!!editingRecord}
        onOk={handleSaveRelationship}
        onCancel={() => setEditingRecord(null)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="relationship"
            label="关系类型"
            rules={[{ required: true, message: '请选择关系类型' }]}
          >
            <Select placeholder="请选择关系类型">
              <Option value="父母">父母</Option>
              <Option value="子女">子女</Option>
              <Option value="配偶">配偶</Option>
              <Option value="其他亲属">其他亲属</Option>
              <Option value="朋友">朋友</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default List;
