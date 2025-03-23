import React, { useEffect, useState } from'react';
import { PageContainer } from '@ant-design/pro-layout';
import { List, Tag, Badge, Button, message, Modal } from 'antd';
import { useModel } from '@@/exports';
import {
  getNotificationsUsingGet,
  markAsReadUsingPost,
  markAllAsReadUsingPost,
} from '@/services/MapBackend/notificationController';
import { confirmApplicationUsingPost } from '@/services/MapBackend/applicationController';

const NotificationList: React.FC = () => {
  const [data, setData] = useState<API.NotificationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { initialState } = useModel('@@initialState');
  const { loginUser } = initialState || {};

  const fetchNotifications = async () => {
    if (!loginUser ||!loginUser.id) {
      console.error('未获取到登录用户信息');
      return;
    }
    setLoading(true);
    try {
      const response = await getNotificationsUsingGet({ userId: loginUser.id });
      if (response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('获取通知失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsReadUsingPost({ notificationId });
      fetchNotifications(); // 重新获取通知列表
      message.success('通知已标记为已读');
    } catch (error) {
      message.error('标记为已读失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // @ts-ignore
      await markAllAsReadUsingPost({ userId: loginUser?.id });
      fetchNotifications(); // 重新获取通知列表
      message.success('全部通知已标记为已读');
    } catch (error) {
      message.error('全部标记为已读失败');
    }
  };

  const handleConfirmApplication = async (notificationId: number, isApproved: boolean) => {
    Modal.confirm({
      title: '请仔细核实信息',
      content: '如果同意，监护人将可以实时监控您的位置信息！是否继续？',
      okText: '同意',
      cancelText: '取消',
      async onOk() {
        try {
          const response = await confirmApplicationUsingPost({ notificationId, isApproved });
          if (response.data) {
            message.success(isApproved? '已同意申请' : '已拒绝申请');
            fetchNotifications(); // 重新获取通知列表
          }
        } catch (error) {
          message.error('操作失败，请重试');
        }
      },
      onCancel() {
        // 取消操作时的处理逻辑
      },
    });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <PageContainer
      extra={[
        <Button key="markAllAsRead" onClick={handleMarkAllAsRead}>
          全部已读
        </Button>,
      ]}
    >
      <List
        dataSource={data}
        loading={loading}
        renderItem={(item) => (
          <List.Item
            actions={[
              !item.is_read && (
                // @ts-ignore
                <Button type="link" onClick={() => handleMarkAsRead(item.id)}>
                  标记为已读
                </Button>
              ),
              // 只有消息内容包含“待确认的绑定申请”时，才根据 status 判断显示内容
              // @ts-ignore
              loginUser.userRole === 'ward' && item.message.includes('待确认的绑定申请') && (
                (() => {
                  switch (item.status) {
                    case 'PENDING_CONFIRMATION':
                      return (
                        <>
                          <Button type="link" onClick={() => handleConfirmApplication(item.id, true)}>
                            同意
                          </Button>
                          <Button type="link" danger onClick={() => handleConfirmApplication(item.id, false)}>
                            拒绝
                          </Button>
                        </>
                      );
                    case 'APPROVED':
                      return <Button type="link" disabled>已通过</Button>;
                    case 'REJECTED':
                      return <Button type="link" disabled danger>已拒绝</Button>;
                    default:
                      return null;
                  }
                })()
              ),
            ]}
          >
            <List.Item.Meta
              title={
                <Badge dot={!item.is_read}>
                  <span>{item.message}</span>
                </Badge>
              }
              description={
                // 只有当用户角色为 ward 且消息内容包含“待确认的绑定申请”时，才显示申请人信息
                // @ts-ignore
                loginUser.userRole === 'ward' && item.message.includes('待确认的绑定申请')
                  ? `时间：${item.created_at}，申请人：${item.userName || '未知'}`
                  : `时间：${item.created_at}`
              }
            />
          </List.Item>
        )}
      />
    </PageContainer>
  );
};

export default NotificationList;
