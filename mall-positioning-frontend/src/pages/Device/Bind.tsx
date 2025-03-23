import React, { useEffect, useState } from 'react';
import { Button, Form, Input, message, Modal } from 'antd';
import { useModel } from '@umijs/max';
import {applyDeviceUsingPost} from "@/services/MapBackend/msmController";
import {bindDeviceUsingPost} from "@/services/MapBackend/deviceController";
import { history } from 'umi';

const Detail: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false); // 控制申请设备弹窗
  const [loading, setLoading] = useState(false); // 加载状态
  const { initialState } = useModel('@@initialState'); // 获取全局状态
  const { loginUser } = initialState || {}; // 获取登录用户信息

  // 申请设备 ID
  const handleApplyDeviceId = async () => {
    if (!loginUser?.email) {
      message.warning('请先绑定邮箱，再到个人空间进行绑定！');
      return;
    }

    setLoading(true);
    try {
      const response = await applyDeviceUsingPost({ email: loginUser.email });
      if (response.code === 0 && response.data) {
        message.success('设备 ID 已发送至您的邮箱，请查收！');
      } else {
        message.error(response.message || '申请设备 ID 失败');
      }
    } catch (error) {
      // @ts-ignore
      console.error('申请设备 ID 失败:', error.message);
      // @ts-ignore
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 绑定设备
  const handleBindDevice = async (values: { deviceId: string }) => {
    const { deviceId } = values;
    if (!deviceId) {
      message.error('请输入设备 ID');
      return;
    }

    setLoading(true);
    try {
      // 调用后端绑定设备接口
      // 假设有一个接口：bindDeviceUsingPost
      const response = await bindDeviceUsingPost({ deviceId });
      if (response.code === 0) {
        message.success('设备绑定成功！');
        form.resetFields(); // 清空表单
        history.push('/device/list');
      } else {
        message.error(response.message || '设备绑定失败');
      }
    } catch (error) {
      console.error('设备绑定失败:', error);
      message.error('设备绑定失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>设备绑定页面</h1>
      <p>展示设备的详细信息，如型号、状态等。</p>

      {/* 申请设备按钮 */}
      <Button
        type="primary"
        onClick={() => setIsModalVisible(true)}
        style={{ marginBottom: 24 }}
      >
        申请设备 ID
      </Button>

      {/* 申请设备弹窗 */}
      <Modal
        title="申请设备 ID"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="apply"
            type="primary"
            loading={loading}
            onClick={handleApplyDeviceId}
            disabled={!loginUser?.email} // 如果没有邮箱，禁用按钮
          >
            申请
          </Button>,
        ]}
      >
        {loginUser?.email ? (
          <p>我们将向您的邮箱 <strong>{loginUser.email}</strong> 发送设备 ID，请查收。</p>
        ) : (
          <p>
            您尚未绑定邮箱，请先到{' '}
            <a href="/personal-info" target="_blank" rel="noopener noreferrer">
              个人空间
            </a>{' '}
            绑定邮箱后再申请设备 ID。
          </p>
        )}
      </Modal>

      {/* 绑定设备表单 */}
      <Form form={form} onFinish={handleBindDevice} layout="vertical">
        <Form.Item
          label="设备 ID"
          name="deviceId"
          rules={[{ required: true, message: '请输入设备 ID' }]}
        >
          <Input placeholder="请输入设备 ID" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            绑定设备
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Detail;
