import React, { useEffect, useState } from'react';
import { Badge, Space } from 'antd';
import { QuestionCircleOutlined, BellOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import Avatar from './AvatarDropdown';
import styles from './index.less';
import { getUnreadNotificationCountUsingGet } from '@/services/MapBackend/notificationController';

const GlobalHeaderRight: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const { loginUser } = initialState || {};
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!loginUser ||!loginUser.id) return;
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
    // 每 10 秒检查一次未读消息数量的更新，你可以根据需求调整
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, 10000);

    return () => clearInterval(intervalId); // 组件卸载时清除定时器
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <Space className={styles.right} align="center">
        {/* 帮助图标 */}
        <span
          className={styles.action}
          onClick={() => {
            window.open('https://pro.ant.design/docs/getting-started');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: '0 8px',
          }}
        >
          <QuestionCircleOutlined style={{ fontSize: '16px' }} />
        </span>

        {/* 用户头像下拉菜单，有未读消息时显示红点 */}
        <Avatar hasUnread={unreadCount > 0} unreadCount={unreadCount} />
      </Space>
    </div>
  );
};

export default GlobalHeaderRight;
