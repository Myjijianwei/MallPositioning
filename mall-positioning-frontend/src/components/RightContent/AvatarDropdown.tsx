import { getUnreadNotificationCountUsingGet } from '@/services/MapBackend/notificationController';
import { BellOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Avatar, Badge, Menu, Spin } from 'antd';
import type { ItemType } from 'antd/es/menu/hooks/useItems';
import { MenuInfo } from 'rc-menu/es/interface';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from'react-dom';
import HeaderDropdown from '../HeaderDropdown';
import styles from './index.less';
import { userLogoutUsingPost } from '@/services/MapBackend/userController';
// @ts-ignore
import { MenuProps } from 'antd/es/dropdown';

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
  const isMounted = useRef(true); // 用于跟踪组件是否已挂载

  useEffect(() => {
    if (unreadCount!== undefined) {
      setLocalUnreadCount(unreadCount);
    }
    return () => {
      isMounted.current = false; // 组件卸载时设置为false
    };
  }, [unreadCount]);

  const fetchUnreadCount = async () => {
    const { loginUser } = initialState || {};
    if (!loginUser ||!loginUser.id) return;
    try {
      const response = await getUnreadNotificationCountUsingGet({ userId: loginUser.id });
      if (response.data && isMounted.current) { // 检查组件是否已挂载
        setLocalUnreadCount(response.data);
      }
    } catch (error) {
      console.error('获取未读通知数量失败', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const onMenuClick = useCallback(
    async (event: MenuInfo) => {
      const { key } = event;
      if (key === 'logout') {
        flushSync(() => {
          setInitialState((s) => ({...s, loginUser: undefined }));
        });
        localStorage.removeItem('userId'); // 清除本地存储的用户 ID
        try {
          await userLogoutUsingPost(); // 等待退出登录操作完成
        } catch (error) {
          console.error('退出登录失败', error);
        }
        history.push('/user/login');
        window.location.reload();
        return;
      }
      if (key === 'center') {
        history.push('/personal');
        return;
      }
      if (key === 'notice') {
        history.push('/notification');
        return;
      }
    },
    [setInitialState],
  );

  const loading = (
    <span className={`${styles.action} ${styles.account}`}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );

  if (!initialState) {
    return loading;
  }

  const { loginUser } = initialState;

  if (!loginUser ||!loginUser.userName) {
    return loading;
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
      label: `我的消息 (${localUnreadCount})`,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const menuHeaderDropdown: MenuProps = {
    className: styles.menu,
    selectedKeys: [],
    onClick: onMenuClick,
    items: menuItems,
  };

  return (
    <HeaderDropdown
      menu={menuHeaderDropdown}
      overlayClassName={styles.menu}
    >
      <span className={`${styles.action} ${styles.account}`}>
        <Badge dot={hasUnread}>
          <Avatar size="small" className={styles.avatar} src={loginUser.userAvatar} alt="avatar" />
        </Badge>
        <span className={`${styles.name} anticon`}>{loginUser.userName}</span>
      </span>
    </HeaderDropdown>
  );
};

export default AvatarDropdown;
