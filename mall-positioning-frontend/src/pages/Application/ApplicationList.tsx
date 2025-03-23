import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Table, Tag } from 'antd';
import { useModel } from '@@/exports';
import { getApplicationsByGidUsingPost } from '@/services/MapBackend/applicationController';

const ApplicationList: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { initialState } = useModel('@@initialState'); // 获取全局状态
  const { loginUser } = initialState || {}; // 获取登录用户信息

  const fetchApplications = async () => {
    if (!loginUser || !loginUser.id) {
      console.error('未获取到登录用户信息或监护人ID');
      return;
    }
    const guardianId = loginUser.id;
    setLoading(true);
    try {
      // @ts-ignore
      const response = await getApplicationsByGidUsingPost({ guardianId });
      if (response.data) {
        // @ts-ignore
        setData(response.data);
      }
    } catch (error) {
      console.error('获取申请记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // 状态渲染逻辑
  const renderStatus = (status: string) => {
    let color = 'default';
    let text = status;

    switch (status) {
      case 'PENDING':
        color = 'blue';
        text = '审批中';
        break;
      case 'PENDING_CONFIRMATION':
        color = 'orange';
        text = '待确认';
        break;
      case 'APPROVED':
        color = 'green';
        text = '已批准';
        break;
      case 'REJECTED':
        color = 'red';
        text = '已拒绝';
        break;
      default:
        color = 'default';
        text = status;
    }

    return <Tag color={color}>{text}</Tag>;
  };

  const columns = [
    {
      title: '申请ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '被监护人设备ID',
      dataIndex: 'ward_device_id',
      key: 'ward_device_id',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: renderStatus, // 使用自定义的状态渲染函数
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
    },
  ];

  return (
    <PageContainer>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={false}
      />
    </PageContainer>
  );
};

export default ApplicationList;
