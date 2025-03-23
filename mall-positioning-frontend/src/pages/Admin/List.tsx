import React, { useState, useEffect } from'react';
import { Table, Input, Button, Space, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import {listAllDeviceUsingGet} from "@/services/MapBackend/deviceController";



const List: React.FC = () => {
  const [deviceList, setDeviceList] = useState<API.DeviceQueryRequest[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDeviceList = async () => {
      setLoading(true);
      try {
        const response = await listAllDeviceUsingGet();
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

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

    }
  ];

  const filteredData = deviceList.filter((device) => {
    return (
      device.id.toLowerCase().includes(searchValue.toLowerCase()) ||
      device.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  });

  return (
    <div>
      <h1>设备列表页面</h1>
      <Space>
        <Input
          placeholder="搜索设备 ID 或名称"
          value={searchValue}
          onChange={handleSearch}
          prefix={<SearchOutlined />}
        />
        <Button type="primary">筛选</Button>
      </Space>
      <Table
        dataSource={filteredData}
        columns={columns}
        loading={loading}
        rowKey={(record) => record.id}
      />
    </div>
  );
};

export default List;
