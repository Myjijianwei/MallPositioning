import React, { useState, useContext } from'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Form, Input, Button, message } from 'antd';
import { submitApplicationUsingPost } from "@/services/MapBackend/applicationController";
import {useModel} from "@@/exports";

const SubmitForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { initialState } = useModel('@@initialState'); // 获取全局状态
  const { loginUser } = initialState || {}; // 获取登录用户信息

  const onFinish = async (values: any) => {
    // @ts-ignore
    const guardianId = loginUser.id;
    const wardDeviceId = values.wardDeviceId;

    console.log('guardianId', guardianId, wardDeviceId);
    setLoading(true);
    try {
      // @ts-ignore
      const response = await submitApplicationUsingPost({ guardianId, wardDeviceId });
      // @ts-ignore
      if (response.data) {
        message.success('申请已提交，审批中');
        form.resetFields();
      } else {
        message.error('提交失败，请重试');
      }
    } catch (error) {
      message.error('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          label="被监护人设备ID"
          name="wardDeviceId"
          rules={[{ required: true, message: '请输入被监护人设备ID' }]}
        >
          <Input placeholder="请输入被监护人设备ID" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            提交申请
          </Button>
        </Form.Item>
      </Form>
    </PageContainer>
  );
};

export default SubmitForm;
