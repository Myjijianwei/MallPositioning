import React, { useEffect, useState } from 'react';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import { useParams, history } from 'umi';
import { confirmApplicationUsingPost } from '@/services/MapBackend/applicationController';

const ConfirmApplication: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (isApproved: boolean) => {
    setLoading(true);
    try {
      // @ts-ignore
      const response = await confirmApplicationUsingPost({ applicationId, isApproved });
      if (response.data) {
        message.success(isApproved ? '已同意申请' : '已拒绝申请');
        history.push('/application/list');
      }
    } catch (error) {
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <ProCard title="确认绑定申请" bordered headerBordered>
        <div style={{ textAlign: 'center', marginTop: 50 }}>
          <h2>您有一条待确认的绑定申请</h2>
          <Button
            type="primary"
            style={{ marginRight: 16 }}
            loading={loading}
            onClick={() => handleConfirm(true)}
          >
            同意
          </Button>
          <Button danger loading={loading} onClick={() => handleConfirm(false)}>
            拒绝
          </Button>
        </div>
      </ProCard>
    </PageContainer>
  );
};

export default ConfirmApplication;
