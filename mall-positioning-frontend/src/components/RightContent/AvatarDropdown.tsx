import { getUnreadNotificationCountUsingGet } from '@/services/MapBackend/notificationController';
import { BellOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Avatar, Badge, Menu, Spin } from 'antd';
import type { ItemType } from 'antd/es/menu/hooks/useItems';
import { MenuInfo } from 'rc-menu/es/interface';
import React, { useCallback, useEffect, useState } from'react';
import { flushSync } from'react-dom';
import HeaderDropdown from '../HeaderDropdown';
import styles from './index.less';
import { userLogoutUsingPost } from '@/services/MapBackend/userController';

export type GlobalHeaderRightProps = {
  menu?: boolean;
  hasUnread?: boolean;
  unreadCount?: number; // 添加接收未读消息数量的属性
};

const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
                                                            hasUnread,
                                                            unreadCount,
                                                          }: GlobalHeaderRightProps) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount || 0);

  useEffect(() => {
    if (unreadCount!== undefined) {
      setLocalUnreadCount(unreadCount);
    }
  }, [unreadCount]);

  const fetchUnreadCount = async () => {
    const { loginUser } = initialState || {};
    if (!loginUser ||!loginUser.id) return;
    try {
      const response = await getUnreadNotificationCountUsingGet({ userId: loginUser.id });
      if (response.data) {
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
    (event: MenuInfo) => {
      const { key } = event;
      if (key === 'logout') {
        // 退出登录逻辑
        flushSync(() => {
          // @ts-ignore
          setInitialState((s) => ({...s, loginUser: undefined }));
        });
        userLogoutUsingPost(); // 调用退出登录接口
        history.push('/user/login'); // 跳转到登录页
        return;
      }
      if (key === 'center') {
        // 跳转到个人中心页面
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
      label: `我的消息 (${localUnreadCount})`, // 使用本地状态显示未读数量
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const menuHeaderDropdown = (
    <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick} items={menuItems} />
  );

  return (
    <HeaderDropdown overlay={menuHeaderDropdown}>
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
