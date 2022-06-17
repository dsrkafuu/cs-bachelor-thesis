import { useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, message, Space } from 'antd';
import { observer } from 'mobx-react-lite';
import useStore from '../../hooks/useStore';

export interface SiteFormData {
  id: string;
  name: string;
  domain: string;
  baseURL?: string;
}

const initialValues: SiteFormData = {
  id: '',
  name: '',
  domain: '',
};

interface SiteFormProps {
  mode: 'add' | 'edit';
  data?: SiteFormData | null;
  onCancel: () => void;
  onSubmitDone?: (data: SiteFormData) => void;
}

function SiteForm({ mode, data, onCancel, onSubmitDone }: SiteFormProps) {
  const { sites } = useStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleAddSubmit = useCallback(
    async (_data: SiteFormData) => {
      setLoading(true);
      try {
        await sites.addSite(_data.name, _data.domain, _data.baseURL);
        setLoading(false);
        message.success('添加站点成功');
        form.resetFields();
        onSubmitDone && onSubmitDone(_data);
      } catch {
        setLoading(false);
        message.error('添加站点失败');
      }
    },
    [form, onSubmitDone, sites]
  );

  const handleEditSubmit = useCallback(
    async (_data: SiteFormData) => {
      setLoading(true);
      try {
        await sites.modifySite(
          data?.id as string,
          _data.name,
          _data.domain,
          _data.baseURL
        );
        setLoading(false);
        message.success('修改站点成功');
        form.resetFields();
        onSubmitDone && onSubmitDone(_data);
      } catch {
        setLoading(false);
        message.error('修改站点失败');
      }
    },
    [data?.id, form, onSubmitDone, sites]
  );

  // force refresh form data
  useEffect(() => {
    form.setFieldsValue(data || initialValues);
  }, [data, form]);

  return (
    <Form
      form={form}
      name='site'
      initialValues={data || initialValues}
      onFinish={mode === 'add' ? handleAddSubmit : handleEditSubmit}
      autoComplete='off'
      layout='horizontal'
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 20 }}
    >
      <Form.Item
        label='站点名称'
        name='name'
        rules={[{ required: true, message: '请输入站点名称' }]}
      >
        <Input placeholder='我的站点' color='rgba(0, 0, 0, 0.3)' />
      </Form.Item>
      <Form.Item
        label='基础域名'
        name='domain'
        rules={[{ required: true, message: '请输入基础域名' }]}
      >
        <Input placeholder='mysite.example.org' color='rgba(0, 0, 0, 0.3)' />
      </Form.Item>
      <Form.Item name='baseURL' label='Base URL'>
        <Input placeholder='/' color='rgba(0, 0, 0, 0.3)' />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
        <Space size='middle'>
          <Button type='primary' htmlType='submit' loading={loading}>
            确认
          </Button>
          <Button htmlType='button' loading={loading} onClick={onCancel}>
            取消
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

export default observer(SiteForm);
