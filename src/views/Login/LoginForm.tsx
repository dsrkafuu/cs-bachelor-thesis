import styles from './LoginForm.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/axios';
import { IPerson, ILockClosed } from '../../icons';
import { AxiosError, AxiosResponse } from 'axios';

interface LoginFormData {
  username: string;
  password: string;
  remember: boolean;
}

const initialValues: LoginFormData = {
  username: '',
  password: '',
  remember: false,
};

function LoginForm() {
  const navigate = useNavigate();
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = useCallback(
    async (data: { username: string; password: string }) => {
      setLoading(true);
      let res: AxiosResponse<string> | undefined;

      try {
        res = await api.post<string>('/auth/login', {
          ...data,
          remember,
        });
      } catch (e) {
        if ((e as AxiosError).response?.status === 401) {
          message.error('用户名或密码错误');
        } else {
          message.error('登陆失败');
        }
        form.resetFields(['password']);
      } finally {
        setLoading(false);
      }
      if (res?.status === 204) {
        message.success('登陆成功');
        navigate('/');
      }
    },
    [form, navigate, remember]
  );

  return (
    <Form
      form={form}
      className={styles.form}
      name='login'
      initialValues={initialValues}
      onFinish={handleSubmit}
      autoComplete='off'
      layout='horizontal'
    >
      <Form.Item
        name='username'
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input
          placeholder='用户名'
          prefix={<IPerson />}
          color='rgba(0, 0, 0, 0.3)'
        />
      </Form.Item>
      <Form.Item
        name='password'
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          placeholder='密码'
          prefix={<ILockClosed />}
          color='rgba(0, 0, 0, 0.3)'
        />
      </Form.Item>
      <Form.Item valuePropName='checked' className={styles.control}>
        <Checkbox
          className={styles.remember}
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        >
          记住我
        </Checkbox>
        <Button type='primary' htmlType='submit' loading={loading}>
          登录
        </Button>
      </Form.Item>
    </Form>
  );
}

export default observer(LoginForm);
