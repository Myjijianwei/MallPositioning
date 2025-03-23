import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, message, Tag } from 'antd';
import { SearchOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import {listAllDeviceUsingGet, listDeviceByIdUsingGet} from '@/services/MapBackend/deviceController';
import { useModel } from '@umijs/max';
import { history } from 'umi';

const List: React.FC = () => {
  const [deviceList, setDeviceList] = useState<API.DeviceQueryRequest[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const { initialState } = useModel('@@initialState');
  // @ts-ignore
  const { currentUser } = initialState || {};

  // 获取设备列表
  useEffect(() => {
    const fetchDeviceList = async () => {
      setLoading(true);
      try {
        const response = await listDeviceByIdUsingGet();
        if (response.code === 0) {
          setDeviceList(response.data);
        } else {
          message.error(response.message);
        }
      } catch (error) {
        console.error('获取设备列表失败:', error);
        message.error('获取设备列表失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchDeviceList();
  }, []);

  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  // 过滤设备列表
  const filteredData = deviceList.filter((device) => {
    return (
      device.id.toLowerCase().includes(searchValue.toLowerCase()) ||
      device.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  });

  // 根据角色分类设备
  const myDevices = filteredData.filter((device) => device.ownerId === currentUser?.id);
  const supervisedDevices = filteredData.filter((device) => device.supervisorId === currentUser?.id);

  // 表格列定义
  const columns: Table.ColumnsType<API.DeviceQueryRequest> = [
    {
      title: '设备 ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '绑定时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '设备描述',
      dataIndex: 'device_description',
      key: 'device_description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {/* 查看实时位置 */}
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => history.push(`/monitor/live/${record.id}`)}
          >
            查看实时位置
          </Button>
          {/* 修改信息（仅自己的设备） */}
          {record.ownerId === currentUser?.id && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => history.push(`/device/detail/${record.id}`)}
            >
              修改信息
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>设备列表页面</h1>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索设备 ID 或名称"
          value={searchValue}
          onChange={handleSearch}
          prefix={<SearchOutlined />}
        />
        <Button type="primary">筛选</Button>
      </Space>

      {/* 我的设备 */}
      <h2>
        <Tag color="blue">我的设备</Tag>
      </h2>
      <Table
        dataSource={myDevices}
        columns={columns}
        loading={loading}
        rowKey={(record) => record.id}
        pagination={false}
      />

      {/* 所监护的设备（仅监护人可见） */}
      {currentUser?.userRole === 'guardian' && (
        <>
          <h2>
            <Tag color="green">所监护的设备</Tag>
          </h2>
          <Table
            dataSource={supervisedDevices}
            columns={columns}
            loading={loading}
            rowKey={(record) => record.id}
            pagination={false}
          />
        </>
      )}
    </div>
  );
};

export default List;
