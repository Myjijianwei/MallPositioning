import GuardianMonitor from '@/components/GuardianMonitor';
import { PageContainer } from '@ant-design/pro-components';
import React from 'react';

const Multi = () => {
  // 内联样式对象
  const styles = {
    monitorWrapper: {
      height: 'calc(100vh - 160px)',
      backgroundColor: '#f0f2f5',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative' as const,
    },
    connectionStatus: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px',
      color: '#666',
    },
    statusIndicator: {
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#52c41a',
      marginRight: '8px',
      animation: 'pulse 1.5s infinite',
    },
    // 全局样式需要通过其他方式注入
  };

  return (
    <PageContainer
      title="实时位置监控系统"
      header={{
        breadcrumb: {},
        extra: [
          <span key="status" style={styles.connectionStatus}>
            <span style={styles.statusIndicator} /> 实时连接中
          </span>
        ]
      }}
    >
      <div style={styles.monitorWrapper}>
        <GuardianMonitor />
        {/* 注入动画样式 */}
        <style>
          {`
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.4; }
              100% { opacity: 1; }
            }
            .amap-marker-label {
              border: none;
              background: rgba(0, 0, 0, 0.7);
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
            }
          `}
        </style>
      </div>
    </PageContainer>
  );
};

export default Multi;
