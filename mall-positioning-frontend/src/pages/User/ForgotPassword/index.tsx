import {
  AlipayCircleOutlined,
  LockOutlined,
  MailOutlined,
  TaobaoCircleOutlined,
  WeiboCircleOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormCaptcha,
  ProFormText,
} from '@ant-design/pro-components';
import { Link, history } from '@umijs/max';
import { message } from 'antd';
import React from 'react';
import { useForm } from 'antd/es/form/Form';
import Footer from '@/components/Footer';
import styles from './index.less';
import { sendEmailUsingGet } from '@/services/MapBackend/msmController';
import { resetPasswordUsingPost } from '@/services/MapBackend/userController';

const ActionIcons = () => {
  return (
    <>
      <AlipayCircleOutlined key="AlipayCircleOutlined" className={styles.action} />
      <TaobaoCircleOutlined key="TaobaoCircleOutlined" className={styles.action} />
      <WeiboCircleOutlined key="WeiboCircleOutlined" className={styles.action} />
    </>
  );
};

const ForgotPassword: React.FC = () => {
  const [form] = useForm();

  const handleSubmit = async (values: API.ResetPasswordRequest) => {
    const { newPassword, confirmPassword } = values;
    if (newPassword !== confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    try {
      const result = await resetPasswordUsingPost(values);
      if (result) {
        message.success('密码重置成功！');
        history.push('/user/login');
      }
    } catch (error) {
      message.error('密码重置失败，请重试！');
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
              submitText: '重置密码',
            },
          }}
          actions={['其他登录方式 :', <ActionIcons key="icons" />]}
          onFinish={async (values) => {
            await handleSubmit(values as API.ResetPasswordRequest);
          }}
        >
          <ProFormText
            fieldProps={{
              size: 'large',
              prefix: <MailOutlined />,
            }}
            name="email"
            placeholder="请输入注册邮箱"
            rules={[
              {
                required: true,
                message: '请输入邮箱地址!',
              },
              {
                type: 'email',
                message: '请输入有效的邮箱地址!',
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
                message: '请输入验证码!',
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

          <ProFormText.Password
            name="newPassword"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder="请输入新密码"
            rules={[
              {
                required: true,
                message: '请输入新密码!',
              },
              {
                min: 8,
                message: '密码长度不能少于8位!',
              },
            ]}
          />

          <ProFormText.Password
            name="confirmPassword"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder="请确认新密码"
            rules={[
              {
                required: true,
                message: '请确认新密码!',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
          />

          <div
            style={{
              marginTop: 24,
              textAlign: 'center',
            }}
          >
            <Link
              to="/user/login"
              onClick={(e) => {
                e.preventDefault();
                history.push('/user/login');
              }}
            >
              返回登录
            </Link>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
