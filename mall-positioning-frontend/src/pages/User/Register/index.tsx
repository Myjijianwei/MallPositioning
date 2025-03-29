import {
  AlipayCircleOutlined,
  LockOutlined,
  MobileOutlined,
  TaobaoCircleOutlined,
  UserOutlined,
  WeiboCircleOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormCaptcha,
  ProFormText,
  ProFormSelect,
} from '@ant-design/pro-components';
import { Link, history } from '@umijs/max';
import { message, Tabs } from 'antd';
import React, { useState } from 'react';
import { useForm } from 'antd/es/form/Form';
import Footer from '@/components/Footer';
import styles from './index.less';
import { sendEmailUsingGet } from '@/services/MapBackend/msmController';
import { userRegisterUsingPost } from '@/services/MapBackend/userController';

const ActionIcons = () => {
  return (
    <>
      <AlipayCircleOutlined key="AlipayCircleOutlined" className={styles.action} />
      <TaobaoCircleOutlined key="TaobaoCircleOutlined" className={styles.action} />
      <WeiboCircleOutlined key="WeiboCircleOutlined" className={styles.action} />
    </>
  );
};

const Register: React.FC = () => {
  const [type, setType] = useState<string>('account');
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
        history.push('/user/login');
      }
    } catch (error) {
      message.error('注册失败，请重试！');
    }
  };

  return (
    <div className={styles.container}>
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          form={form}
          logo={<img alt="logo" src="/logo.svg" />}
          title="Safe Guardian"
          subTitle="Safe Guardian，实时守护，让关爱无处不在"
          submitter={{
            searchConfig: {
              submitText: '注册',
            },
          }}
          actions={['其他登录方式 :', <ActionIcons key="icons" />]}
          onFinish={async (values) => {
            await handleSubmit(values as API.UserRegisterRequest);
          }}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[
              {
                key: 'account',
                label: '账号密码注册',
              },
            ]}
          />

          {type === 'account' && (
            <>
              <ProFormText
                name="userAccount"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined />,
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
                  prefix: <LockOutlined />,
                }}
                placeholder="请输入密码"
                rules={[
                  {
                    required: true,
                    message: '密码是必填项！',
                  },
                  {
                    min: 8,
                    message: '长度不能小于8位',
                  },
                ]}
              />

              <ProFormText.Password
                name="checkPassword"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                placeholder="请再次输入密码"
                rules={[
                  {
                    required: true,
                    message: '确认密码是必填项！',
                  },
                  {
                    min: 8,
                    message: '长度不能小于8位',
                  },
                ]}
              />

              <ProFormSelect
                name="userRole"
                fieldProps={{
                  size: 'large',
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
                  prefix: <MobileOutlined />,
                }}
                name="email"
                placeholder="请输入邮箱号"
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
                  prefix: <LockOutlined />,
                }}
                captchaProps={{
                  size: 'large',
                }}
                placeholder="请输入验证码"
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

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link
              to="/user/login"
              onClick={(e) => {
                e.preventDefault();
                history.push('/user/login');
              }}
            >
              已有账号？立即登录
            </Link>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
