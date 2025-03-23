import { LockOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import { message, Tabs, Button } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'umi';
import Footer from '@/components/Footer';
import './index.less';

import { LoginForm, ProFormCaptcha, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { userRegisterUsingPost } from '@/services/backend/userController';
import { sendEmailUsingGet } from '@/services/MapBackend/msmController';
import { useForm } from 'antd/es/form/Form';

const Register: React.FC = () => {
  const [type, setType] = useState<string>('account');
  const navigate = useNavigate();
  const [form] = useForm();

  const handleSubmit = async (values: API.UserRegisterRequest) => {
    const { userPassword, checkPassword } = values;
    if (userPassword !== checkPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    try {
      const result = await userRegisterUsingPost(values);
      if (result) {
        message.success('注册成功！');
        navigate('/user/login');
      }
    } catch (error) {
      message.error('注册失败，请重试！');
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <LoginForm
          form={form}
          submitter={{
            searchConfig: {
              submitText: '注册',
            },
          }}
          logo={<img alt="logo" src="/logo.svg" className="register-logo" />}
          title="Safe Guardian"
          subTitle="Safe Guardian，实时守护，让关爱无处不在"
          onFinish={async (values) => {
            await handleSubmit(values as API.UserRegisterRequest);
          }}
        >
          <Tabs activeKey={type} onChange={setType} className="register-tabs">
            <Tabs.TabPane key="account" tab="账号密码注册" />
          </Tabs>
          {type === 'account' && (
            <>
              <ProFormText
                name="userAccount"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className="prefix-icon" />,
                }}
                placeholder="请输入账号"
                rules={[
                  {
                    required: true,
                    message: '账号是必填项！',
                  },
                ]}
              />

              <ProFormText.Password
                name="userPassword"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className="prefix-icon" />,
                }}
                placeholder="请输入密码"
                rules={[
                  {
                    required: true,
                    message: '密码是必填项！',
                  },
                  {
                    min: 8,
                    message: '长度不能小于 8',
                  },
                ]}
              />
              <ProFormText.Password
                name="checkPassword"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className="prefix-icon" />,
                }}
                placeholder="请再次输入密码"
                rules={[
                  {
                    required: true,
                    message: '确认密码是必填项！',
                  },
                  {
                    min: 8,
                    message: '长度不能小于 8',
                  },
                ]}
              />

              <ProFormSelect
                name="userRole"
                fieldProps={{
                  size: 'large',
                  style: { width: '100%' }, // 确保选择框有足够的宽度
                }}
                placeholder="请选择用户身份"
                rules={[
                  {
                    required: true,
                    message: '用户身份是必填项！',
                  },
                ]}
                options={[
                  { label: '监护人', value: 'guardian' },
                  { label: '被监护人', value: 'ward' },
                ]}
              />

              <ProFormText
                fieldProps={{
                  size: 'large',
                  prefix: <MobileOutlined className="prefix-icon" />,
                }}
                name="email"
                placeholder="请输入邮箱号！"
                rules={[
                  {
                    required: true,
                    message: '邮箱号是必填项！',
                  },
                  {
                    pattern: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                    message: '不合法的邮箱号！',
                  },
                ]}
              />
              <ProFormCaptcha
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className="prefix-icon" />,
                }}
                captchaTextRender={(timing, count) => {
                  if (timing) {
                    return `${count} 秒后重新获取`;
                  }
                  return '获取验证码';
                }}
                name="code"
                rules={[
                  {
                    required: true,
                    message: '验证码是必填项！',
                  },
                ]}
                onGetCaptcha={async () => {
                  const email = form.getFieldValue('email');
                  if (!email) {
                    message.error('请先输入邮箱地址！');
                    return;
                  }
                  try {
                    await sendEmailUsingGet({ email });
                    message.success('获取验证码成功！');
                  } catch (error) {
                    message.error('获取验证码失败，请重试！');
                  }
                }}
              />
            </>
          )}
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
