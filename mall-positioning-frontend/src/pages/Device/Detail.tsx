import React, { useState, useEffect } from 'react';
import { useParams, history } from 'umi';
import { Button, Form, Input, message, Card } from 'antd';
import { getDeviceByIdUsingGet, updateDeviceUsingPost } from '@/services/MapBackend/deviceController';

const DeviceEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // 获取设备 ID
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<API.DeviceQueryRequest | null>(null);

  // 获取设备信息
  useEffect(() => {
    const fetchDeviceInfo = async () => {
      setLoading(true);
      try {
        const response = await getDeviceByIdUsingGet({ id });
        if (response.code === 0 && response.data) {
          setDeviceInfo(response.data);
          form.setFieldsValue(response.data); // 填充表单
        } else {
          message.error(response.message || '获取设备信息失败');
        }
      } catch (error) {
        console.error('获取设备信息失败:', error);
        message.error('获取设备信息失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchDeviceInfo();
  }, [id]);

  // 提交表单
  const handleSubmit = async (values: API.DeviceUpdateRequest) => {
    setLoading(true);
    try {
      const response = await updateDeviceUsingPost({ ...values, id });
      if (response.code === 0) {
        message.success('设备信息更新成功');
        history.push('/device/list'); // 返回设备列表页面
      } else {
        message.error(response.message || '设备信息更新失败');
      }
    } catch (error) {
      console.error('设备信息更新失败:', error);
      message.error('设备信息更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="设备信息编辑" loading={loading}>
        {/* 设备信息展示 */}
        {deviceInfo && (
          <div style={{ marginBottom: 24 }}>
            <p>
              <strong>设备 ID:</strong> {deviceInfo.id}
            </p>
            <p>
              <strong>绑定时间:</strong> {deviceInfo.created_at}
            </p>
          </div>
        )}

        {/* 编辑表单 */}
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="设备名称"
            name="name"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="请输入设备名称" />
          </Form.Item>
          <Form.Item label="设备描述" name="device_description">
            <Input.TextArea placeholder="请输入设备描述" rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存修改
            </Button>
            <Button style={{ marginLeft: 16 }} onClick={() => history.push('/device/list')}>
              返回
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DeviceEditPage;
