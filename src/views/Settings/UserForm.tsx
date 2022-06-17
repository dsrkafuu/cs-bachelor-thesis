import { useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, message, Space, Select } from 'antd';
import useStore from '../../hooks/useStore';
import { AxiosError } from 'axios';
import useCurUser from '../../hooks/useCurUser';
import { observer } from 'mobx-react-lite';

export interface UserFormData {
  id: string;
  username: string;
  origpass?: string;
  password: string;
  role: string;
  root: boolean;
}

const initialValues: UserFormData = {
  id: '',
  username: '',
  password: '',
  role: 'user',
  root: false,
};

interface UserFormProps {
  mode: 'add' | 'edit';
  data?: UserFormData | null;
  onCancel?: () => void;
  onSubmitDone?: (data: UserFormData) => void;
  noAdminMode?: boolean;
}

function UserForm({
  mode,
  data,
  onCancel,
  onSubmitDone,
  noAdminMode,
}: UserFormProps) {
  const { curUser } = useCurUser();
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAddSubmit = useCallback(
    async (_data: UserFormData) => {
      setLoading(true);
      try {
        await user.addUser(
          _data.username,
          _data.password,
          _data.role || 'user'
        );
        setLoading(false);
        message.success('添加用户成功');
        form.resetFields();
        onSubmitDone && onSubmitDone(_data);
      } catch {
        setLoading(false);
        message.error('添加用户失败');
      }
    },
    [form, onSubmitDone, user]
  );

  const handleEditSubmit = useCallback(
    async (_data: UserFormData) => {
      setLoading(true);
      try {
        await user.modifyUser(
          data?.id as string,
          _data.username,
          _data.origpass || '',
          _data.password,
          _data.role || 'user'
        );
        setLoading(false);
        message.success('修改用户成功');
        form.resetFields(['origpass', 'password']);
        onSubmitDone && onSubmitDone(_data);
      } catch (e) {
        if ((e as AxiosError).response?.status === 403) {
          message.error('原密码错误');
        } else {
          message.error('修改用户失败');
        }
        form.resetFields(['origpass', 'password']);
        setLoading(false);
      }
    },
    [data?.id, form, onSubmitDone, user]
  );

  // force refresh form data
  useEffect(() => {
    form.setFieldsValue(data || initialValues);
  }, [data, form]);

  return (
    <Form
      form={form}
      name='user'
      initialValues={data || initialValues}
      onFinish={mode === 'add' ? handleAddSubmit : handleEditSubmit}
      autoComplete='off'
      layout='horizontal'
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
    >
      <Form.Item
        label='用户名'
        name='username'
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input
          placeholder='[a-z][0-9a-z_-]'
          color='rgba(0, 0, 0, 0.3)'
          disabled={mode === 'edit'}
        />
      </Form.Item>
      {mode === 'add' && (
        <Form.Item label='密码' name='password'>
          <Input.Password
            placeholder='[0-9a-z!@#$%^&*_-]'
            color='rgba(0, 0, 0, 0.3)'
          />
        </Form.Item>
      )}
      {mode === 'edit' && curUser?.role !== 'admin' && (
        <Form.Item label='原密码' name='origpass'>
          <Input.Password
            placeholder='[0-9a-z!@#$%^&*_-]'
            color='rgba(0, 0, 0, 0.3)'
          />
        </Form.Item>
      )}
      {mode === 'edit' && (
        <Form.Item label='新密码' name='password'>
          <Input.Password
            placeholder='[0-9a-z!@#$%^&*_-]'
            color='rgba(0, 0, 0, 0.3)'
          />
        </Form.Item>
      )}
      <Form.Item
        label='身份'
        name='role'
        rules={[{ required: true, message: '请选择身份' }]}
      >
        <Select disabled={noAdminMode}>
          <Select.Option value='user'>普通用户</Select.Option>
          <Select.Option value='admin'>管理员</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
        <Space size='middle'>
          <Button type='primary' htmlType='submit' loading={loading}>
            确认
          </Button>
          {!noAdminMode && (
            <Button htmlType='button' loading={loading} onClick={onCancel}>
              取消
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
}

export default observer(UserForm);
