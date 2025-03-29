import { getUnreadNotificationCountUsingGet } from '@/services/MapBackend/notificationController';
import { BellOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Avatar, Badge, Menu, Spin } from 'antd';
import type { ItemType } from 'antd/es/menu/hooks/useItems';
import { MenuInfo } from 'rc-menu/es/interface';
import React, { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import HeaderDropdown from '../HeaderDropdown';
import styles from './index.less';
import { userLogoutUsingPost } from '@/services/MapBackend/userController';

export type GlobalHeaderRightProps = {
  menu?: boolean;
  hasUnread?: boolean;
  unreadCount?: number;
};

const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
                                                            hasUnread,
                                                            unreadCount,
                                                          }: GlobalHeaderRightProps) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount || 0);

  const fetchUnreadCount = useCallback(async () => {
    const { loginUser } = initialState || {};
    if (!loginUser?.id) return;

    try {
      console.log('Fetching unread count for user:', loginUser.id);
      const response = await getUnreadNotificationCountUsingGet({
        userId: Number(loginUser.id)
      });

      console.log('API response:', response);
      if (response?.code === 0 && response.data !== undefined) {
        setLocalUnreadCount(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [initialState?.loginUser?.id]);

  useEffect(() => {
    fetchUnreadCount();

    // 可以添加轮询逻辑，每30秒刷新一次
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const onMenuClick = useCallback(
    async (event: MenuInfo) => {
      const { key } = event;
      if (key === 'logout') {
        flushSync(() => {
          setInitialState((s) => ({ ...s, loginUser: undefined }));
        });
        localStorage.removeItem('userId');
        try {
          await userLogoutUsingPost();
        } catch (error) {
          console.error('Logout failed:', error);
        }
        history.push('/user/login');
        return;
      }
      if (key === 'center') history.push('/personal');
      if (key === 'notice') history.push('/notification');
    },
    [setInitialState]
  );

  if (!initialState) {
    return (
      <span className={`${styles.action} ${styles.account}`}>
        <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />
      </span>
    );
  }

  const { loginUser } = initialState;
  if (!loginUser?.userName) {
    return (
      <span className={`${styles.action} ${styles.account}`}>
        <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />
      </span>
    );
  }

  const menuItems: ItemType[] = [
    {
      key: 'center',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'notice',
      icon: <BellOutlined />,
      label: (
        <span>
          我的消息
          {localUnreadCount > 0 && (
            <span style={{ marginLeft: 4 }}>({localUnreadCount})</span>
          )}
        </span>
      ),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  return (
    <HeaderDropdown
      menu={{
        items: menuItems,
        onClick: onMenuClick,
      }}
      overlayClassName={styles.menu}
    >
      <span className={`${styles.action} ${styles.account}`}>
        <Badge dot={hasUnread || localUnreadCount > 0}>
          <Avatar
            size="small"
            className={styles.avatar}
            src={loginUser.userAvatar}
            alt="avatar"
          />
        </Badge>
        <span className={`${styles.name} anticon`}>{loginUser.userName}</span>
      </span>
    </HeaderDropdown>
  );
};

export default AvatarDropdown;
