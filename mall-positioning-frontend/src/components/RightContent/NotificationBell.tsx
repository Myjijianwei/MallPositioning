import React, { useEffect, useState } from 'react';
import { Badge, Dropdown, Menu } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useModel, history } from '@umijs/max';
import { getUnreadNotificationCountUsingGet } from '@/services/MapBackend/notificationController';

const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { initialState } = useModel('@@initialState');
  const { loginUser } = initialState || {};

  const fetchUnreadCount = async () => {
    if (!loginUser || !loginUser.id) return;
    try {
      const response = await getUnreadNotificationCountUsingGet({ userId: loginUser.id });
      if (response.data) {
        setUnreadCount(response.data);
      }
    } catch (error) {
      console.error('获取未读通知数量失败', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={() => history.push('/notification')}>
        查看通知
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Badge count={unreadCount}>
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
