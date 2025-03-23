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
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Alert, message, Tabs } from 'antd';
import React, { useState } from'react';
import { useForm } from 'antd/es/form/Form';
import Footer from '@/components/Footer';
import styles from './index.less'; // 使用 CSS Modules
import { useNavigate } from 'react-router-dom';
import {userLoginUsingPost} from "@/services/backend/userController";
import {loginByEmailUsingPost} from "@/services/MapBackend/userController";
import {sendEmailUsingGet} from "@/services/MapBackend/msmController";

const ActionIcons = () => {
  return (
    <>
      <AlipayCircleOutlined key="AlipayCircleOutlined" className={styles.action} />
      <TaobaoCircleOutlined key="TaobaoCircleOutlined" className={styles.action} />
      <WeiboCircleOutlined key="WeiboCircleOutlined" className={styles.action} />
    </>
  );
};

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [userLoginState] = useState<any>({});
  const [type, setType] = useState<string>('account');
  const { setInitialState } = useModel('@@initialState');
  const [form] = useForm();

  const navigate = useNavigate();
  const handleSubmit = async (values: any) => {
    try {
      let res;
      if (type === 'account') {
        res = await userLoginUsingPost(values);
      } else if (type === 'email') {
        res = await loginByEmailUsingPost(values);
      }
      if (res?.data) {
        message.success('登录成功！');
        // @ts-ignore
        localStorage.setItem('userId', res?.data?.id);
        navigate('/welcome'); // 使用 navigate 进行跳转
        setInitialState({
          loginUser: res.data,
        });
      }
    } catch (error) {
      message.error('登录失败，请重试！');
    }
  };

  const { status, type: loginType } = userLoginState;

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
          initialValues={{
            autoLogin: true,
          }}
          actions={['其他登录方式 :', <ActionIcons key="icons" />]}
          onFinish={async (values) => {
            await handleSubmit(values);
          }}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[
              {
                key: 'account',
                label: '账户密码登录',
              },
              {
                key: 'email',
                label: '邮箱登录',
              },
            ]}
          />

          {status === 'error' && loginType === 'account' && (
            <LoginMessage content="错误的用户名和密码" />
          )}
          {type === 'account' && (
            <>
              <ProFormText
                name="userAccount"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined />,
                }}
                placeholder="用户名: admin or user"
                rules={[
                  {
                    required: true,
                    message: '用户名是必填项！',
                  },
                ]}
              />
              <ProFormText.Password
                name="userPassword"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                placeholder="密码: ant.design"
                rules={[
                  {
                    required: true,
                    message: '密码是必填项！',
                  },
                ]}
              />
            </>
          )}

          {type === 'email' && (
            <>
              <ProFormText
                fieldProps={{
                  size: 'large',
                  prefix: <MobileOutlined />,
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
                  prefix: <LockOutlined />,
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
          <div
            style={{
              marginBottom: 24,
            }}
          >
            <ProFormCheckbox noStyle name="autoLogin">
              自动登录
            </ProFormCheckbox>
            <a
              style={{
                float: 'right',
              }}
              onClick={() => history.push('/forgot-password')} // 跳转到忘记密码页面
            >
              忘记密码 ?
            </a>
          </div>
          <div style={{ textAlign: 'center' }}>
            <a onClick={() => history.push('/user/register')}>没有账号？点击注册</a>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
