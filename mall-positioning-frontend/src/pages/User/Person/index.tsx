import { getUserByIdUsingGet, updateUserUsingPost } from '@/services/backend/userController';
import { uploadUsingPost } from '@/services/MapBackend/fileUploadController';
import { sendEmailUsingGet } from '@/services/MapBackend/msmController';
import { UploadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Avatar, Button, Form, Input, message, Modal, Select } from 'antd';
import { useEffect, useState } from 'react';
import './PersonalInfoSettings.less';

const { TextArea } = Input;
const { Option } = Select;

// 定义用户信息类型
type UserInfo = {
  userName: string;
  email: string;
  userAvatar: string;
  userProfile: string;
  code: string;
  userRole: string;
};

const Index = () => {
  const [form] = Form.useForm();
  const [initialInfo, setInitialInfo] = useState<UserInfo>({
    userName: '',
    email: '',
    userAvatar: '',
    userProfile: '',
    code: '',
    userRole: '',
  });
  const [editedInfo, setEditedInfo] = useState<UserInfo>({ ...initialInfo });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState(''); // 验证码输入
  const [isVerificationSent, setIsVerificationSent] = useState(false); // 是否已发送验证码
  const [verificationCodeExpired, setVerificationCodeExpired] = useState(false); // 验证码是否过期
  const VERIFICATION_CODE_EXPIRE_TIME = 300000; // 验证码有效期 5 分钟，单位毫秒

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.error('未找到用户 ID，请先登录');
          message.error('请先登录');
          return;
        }
        const response = await getUserByIdUsingGet({ id: userId });
        if (response && response.code === 0 && response.data) {
          const userData = response.data;
          console.log('获取到的用户信息:', userData);
          setInitialInfo(userData);
          setEditedInfo(userData);
          form.setFieldsValue(userData);
        } else {
          console.error('后端返回的数据格式不正确:', response);
          message.error('获取用户信息失败，请稍后重试');
          if (response && response.message) {
            // 如果后端返回了具体错误信息，展示给用户
            message.error(response.message);
          } else {
            // 否则提示网络或服务器问题
            message.error('请检查网络连接或服务器状态');
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        message.error('获取用户信息失败，请稍后重试');
        message.error('请检查网络连接或服务器状态');
      }
    };
    fetchUserInfo();
  }, []);

  // 发送验证码
  const sendVerificationCode = async () => {
    try {
      // 调用后端接口发送验证码
      const response = await sendEmailUsingGet({ email: editedInfo.email });
      if (response.code === 0) {
        message.success('验证码已发送，请查收邮箱');
        setIsVerificationSent(true); // 标记验证码已发送
        // 记录验证码发送时间，用于判断是否过期
        const sendTime = Date.now();
        setTimeout(() => {
          const currentTime = Date.now();
          if (currentTime - sendTime > VERIFICATION_CODE_EXPIRE_TIME) {
            setVerificationCodeExpired(true);
            setIsVerificationSent(false);
            message.error('验证码已过期，请重新发送');
          }
        }, VERIFICATION_CODE_EXPIRE_TIME);
      } else {
        message.error('验证码发送失败，请重试');
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      message.error('发送验证码失败，请稍后重试');
    }
  };

  const onFinish = async () => {
    try {
      setLoading(true);

      // 验证验证码
      if (editedInfo.email !== initialInfo.email && (!verificationCode || verificationCodeExpired)) {
        if (!verificationCode) {
          message.error('请先输入验证码');
        } else {
          message.error('验证码已过期，请重新发送');
        }
        return;
      }

      let avatarUrl = editedInfo.userAvatar;

      // 如果有新选择的文件，先上传到 OSS
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadResponse = await uploadUsingPost({}, selectedFile);
        if (uploadResponse && uploadResponse.code === 0) {
          avatarUrl = uploadResponse.data; // 获取 OSS 返回的头像 URL
        } else {
          if (uploadResponse && uploadResponse.message) {
            message.error(uploadResponse.message);
          } else {
            message.error('头像上传失败，请检查文件格式或网络连接');
          }
          return;
        }
      }

      // 提交用户信息
      const updatedData = {
        ...editedInfo,
        userAvatar: avatarUrl, // 使用新的头像 URL
        code: verificationCode,
      };

      console.log('提交的数据:', updatedData); // 调试：打印提交的数据

      const res = await updateUserUsingPost(updatedData);
      if (res.code === 0) {
        message.success('信息更新成功');
        // 延迟 500 毫秒后刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        if (res.message) {
          message.error(res.message);
        } else {
          message.error('信息更新失败，请检查网络或稍后重试');
        }
      }
    } catch (error) {
      console.error('提交信息更新失败:', error);
      message.error('提交失败，请检查网络或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    setEditedInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件大小（10MB）
      if (file.size > 10 * 1024 * 1024) {
        message.error('文件大小不能超过 10MB');
        return;
      }
      // 检查文件类型是否为图片
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (!allowedImageTypes.includes(file.type)) {
        message.error('请选择有效的图片文件');
        return;
      }
      setSelectedFile(file);
      // 读取文件内容并设置为头像 URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedInfo((prevInfo) => ({
          ...prevInfo,
          userAvatar: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
      setUploadModalVisible(false); // 选择文件后关闭模态框
    }
  };

  const handleCancel = () => {
    window.location.reload();
  };

  return (
    <PageContainer title="个人信息设置">
      <Form form={form} onFinish={onFinish} layout="vertical" className="personal-info-form">
        <Form.Item
          label="用户名"
          name="userName"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            value={editedInfo.userName}
            onChange={(e) => handleChange('userName', e.target.value)}
          />
        </Form.Item>
        <Form.Item label="邮箱" name="email" rules={[{ required: false }]}>
          <Input
            value={editedInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
          {editedInfo.email !== initialInfo.email && (
            <div style={{ marginTop: 8 }}>
              <Button onClick={sendVerificationCode} disabled={isVerificationSent}>
                {isVerificationSent ? '验证码已发送' : '发送验证码'}
              </Button>
              <Input
                placeholder="请输入验证码"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                style={{ marginTop: 8 }}
              />
            </div>
          )}
        </Form.Item>
        <Form.Item label="个人简介" name="userProfile" rules={[{ required: false }]}>
          <TextArea
            value={editedInfo.userProfile}
            onChange={(e) => handleChange('userProfile', e.target.value)}
            rows={4}
          />
        </Form.Item>
        <Form.Item label="头像">
          <div onClick={() => setUploadModalVisible(true)} style={{ cursor: 'pointer' }}>
            {editedInfo.userAvatar ? (
              <Avatar src={editedInfo.userAvatar} style={{ width: 64, height: 64 }} />
            ) : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传头像</div>
              </div>
            )}
          </div>
        </Form.Item>
        <div>
          <Button type="primary" htmlType="submit" loading={loading}>
            提交修改
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={handleCancel}>
            取消修改
          </Button>
        </div>
      </Form>
      <Modal
        title="上传头像"
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null} // 移除模态框的默认按钮
      >
        <input type="file" onChange={handleSelectFile} accept="image/*" />{' '}
        {/* 限制文件类型为图片 */}
      </Modal>
    </PageContainer>
  );
};

export default Index;
