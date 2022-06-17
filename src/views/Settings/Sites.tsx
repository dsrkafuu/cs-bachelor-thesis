import styles from './Sites.module.scss';
import { Button, message, Modal, Space, Table } from 'antd';
import { observer } from 'mobx-react-lite';
import dayjs from '../../../lib/dayjs';
import useStore from '../../hooks/useStore';
import { SiteData } from '../../store/modules/Sites';
import { toJS } from 'mobx';
import { strSorter } from '../../utils/sorter';
import { useCallback, useMemo, useState } from 'react';
import SiteForm, { SiteFormData } from './SiteForm';
import Label from '../../components/basics/Label';
import { version } from '../../utils/meta';

function Sites() {
  const { sites } = useStore();

  const [addModal, setAddModal] = useState(false);
  const closeAddModal = useCallback(() => setAddModal(false), []);
  const [editModal, setEditModal] = useState<SiteFormData | null>(null);
  const closeEditModal = useCallback(() => setEditModal(null), []);
  const [codeModal, setCodeModal] = useState('');
  const closeCodeModal = useCallback(() => setCodeModal(''), []);

  const [deleteLoading, setDeleteLoading] = useState('');
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        setDeleteLoading(id);
        await sites.deleteSite(id);
        setDeleteLoading('');
        message.success('删除站点成功');
      } catch {
        setDeleteLoading('');
        message.error('删除站点失败');
      }
    },
    [sites]
  );
  const [deleteMultipleLoading, setDeleteMultipleLoading] = useState(false);
  const handleDeleteMultiple = useCallback(
    async (ids: string[]) => {
      try {
        setDeleteMultipleLoading(true);
        await sites.deleteSites(ids);
        setDeleteMultipleLoading(false);
        message.success('删除站点成功');
      } catch (e) {
        setDeleteMultipleLoading(false);
        message.error('删除站点失败');
      }
    },
    [sites]
  );

  const [selected, setSelected] = useState<string[]>([]);
  const columns = useMemo(() => {
    return [
      {
        title: 'ID',
        key: 'id',
        sorter: (a: SiteData, b: SiteData) => strSorter(a.id, b.id),
        width: 300,
        render: (record: SiteData) => <Label>{record.id}</Label>,
      },
      {
        title: '名称',
        key: 'name',
        dataIndex: 'name',
        sorter: (a: SiteData, b: SiteData) => strSorter(a.id, b.id),
      },
      {
        title: '基础域名',
        key: 'domain',
        render: (record: SiteData) => <Label>{record.domain}</Label>,
      },
      {
        title: 'Base URL',
        key: 'baseURL',
        render: (record: SiteData) =>
          record.baseURL ? <Label>{record.baseURL}</Label> : '',
      },
      {
        title: '创建日期',
        key: '_created',
        render: (record: SiteData) =>
          dayjs(record._created).format('YYYY-MM-DD HH:mm:ss'),
        sorter: (a: SiteData, b: SiteData) => strSorter(a._created, b._created),
      },
      {
        title: '操作',
        key: 'action',
        width: 240,
        render: (record: SiteData) => (
          <Space size='middle'>
            <Button type='primary' onClick={() => setCodeModal(record.id)}>
              安装
            </Button>
            <Button onClick={() => setEditModal(record)}>编辑</Button>
            <Button
              danger
              onClick={() => handleDelete(record.id)}
              loading={deleteLoading === record.id}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ];
  }, [deleteLoading, handleDelete]);

  return (
    <div>
      <Space size='middle' className={styles.control}>
        <Button type='primary' onClick={() => setAddModal(true)}>
          添加站点
        </Button>
        <Button
          disabled={selected.length === 0}
          danger
          onClick={() => handleDeleteMultiple(selected)}
          loading={deleteMultipleLoading}
        >
          批量删除
        </Button>
      </Space>
      <Table
        rowKey='id'
        dataSource={toJS(sites.sites)}
        columns={columns}
        rowSelection={{
          selections: true,
          selectedRowKeys: selected,
          onChange: setSelected as any,
        }}
        pagination={{
          defaultPageSize: 5,
        }}
      />
      <Modal
        title='添加站点'
        visible={addModal}
        footer={null}
        onCancel={closeAddModal}
      >
        <SiteForm
          mode='add'
          onCancel={closeAddModal}
          onSubmitDone={closeAddModal}
        />
      </Modal>
      <Modal
        title='编辑站点'
        visible={!!editModal}
        footer={null}
        onCancel={closeEditModal}
      >
        <SiteForm
          mode='edit'
          data={editModal}
          onCancel={closeEditModal}
          onSubmitDone={closeEditModal}
        />
      </Modal>
      <Modal
        title='站点代码'
        visible={!!codeModal}
        onCancel={closeCodeModal}
        onOk={closeCodeModal}
      >
        <div className={styles.codet}>CDN 引入</div>
        <pre className={styles.code}>
          <code>{`<script async data-id='${codeModal}' data-host='${window.location.origin}' src='https://cdn.jsdelivr.net/npm/dsr-analytics@${version}/dist/client.min.js'></script>`}</code>
        </pre>
        <div className={styles.codet}>NPM 引入</div>
        <pre className={styles.code}>
          <code>{`npm install dsr-analytics --save`}</code>
        </pre>
        <pre className={styles.code}>
          <code>{`import withDSRA from 'dsr-analytics';
const dsra = withDSRA('${codeModal}', '${window.location.origin}');
dsra.sendView('/', document.title, document.referrer);`}</code>
        </pre>
      </Modal>
    </div>
  );
}

export default observer(Sites);
