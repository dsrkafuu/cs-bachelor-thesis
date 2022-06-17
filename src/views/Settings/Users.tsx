import styles from './Users.module.scss';
import { Button, message, Modal, Space, Table } from 'antd';
import { observer } from 'mobx-react-lite';
import useStore from '../../hooks/useStore';
import { toJS } from 'mobx';
import { strSorter } from '../../utils/sorter';
import { useCallback, useMemo, useState } from 'react';
import Label from '../../components/basics/Label';
import dayjs from '../../../lib/dayjs';
import UserForm, { UserFormData } from './UserForm';
import { UserData } from '../../store/modules/User';

function Users() {
  const { user } = useStore();

  const [addModal, setAddModal] = useState(false);
  const closeAddModal = useCallback(() => setAddModal(false), []);
  const [editModal, setEditModal] = useState<UserFormData | null>(null);
  const closeEditModal = useCallback(() => setEditModal(null), []);

  const [deleteLoading, setDeleteLoading] = useState('');
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        setDeleteLoading(id);
        await user.deleteUser(id);
        setDeleteLoading('');
        message.success('删除用户成功');
      } catch {
        setDeleteLoading('');
        message.error('删除用户失败');
      }
    },
    [user]
  );
  const [deleteMultipleLoading, setDeleteMultipleLoading] = useState(false);
  const handleDeleteMultiple = useCallback(
    async (ids: string[]) => {
      try {
        setDeleteMultipleLoading(true);
        await user.deleteUsers(ids);
        setDeleteMultipleLoading(false);
        message.success('删除用户成功');
      } catch {
        setDeleteMultipleLoading(false);
        message.error('删除用户失败');
      }
    },
    [user]
  );

  const [selected, setSelected] = useState<string[]>([]);
  const rootUsers = useMemo(
    () =>
      toJS(user.users)
        .filter((u) => u.root)
        .map((u) => u.id),
    [user.users]
  );
  const selectedIncludesRoot = useMemo(
    () => selected.some((id) => rootUsers.includes(id)),
    [rootUsers, selected]
  );

  const columns = useMemo(() => {
    return [
      {
        title: 'ID',
        key: 'id',
        sorter: (a: UserData, b: UserData) => strSorter(a.id, b.id),
        width: 300,
        render: (record: UserData) => <Label>{record.id}</Label>,
      },
      {
        title: '用户名',
        key: 'username',
        sorter: (a: UserData, b: UserData) => strSorter(a.id, b.id),
        render: (record: UserData) => (
          <>
            {record.root ? (
              <Space>
                <Label>{record.username}</Label>
                <Label color='#fff' bgColor='#d38aa2'>
                  根用户
                </Label>
              </Space>
            ) : (
              <Label>{record.username}</Label>
            )}
          </>
        ),
      },
      {
        title: '身份',
        key: 'role',
        render: (record: UserData) => (
          <Label
            className={styles.label}
            color='#fff'
            bgColor={record?.role === 'admin' ? '#77ccb0' : '#7793cc'}
          >
            {record?.role === 'admin' ? '管理员' : '普通用户'}
          </Label>
        ),
      },
      {
        title: '创建日期',
        key: '_created',
        render: (record: UserData) =>
          dayjs(record._created).format('YYYY-MM-DD HH:mm:ss'),
        sorter: (a: UserData, b: UserData) => strSorter(a._created, b._created),
      },
      {
        title: '操作',
        key: 'action',
        width: 240,
        render: (record: UserData) => (
          <Space size='middle'>
            <Button
              onClick={() =>
                setEditModal({ ...record, password: '', root: false })
              }
            >
              编辑
            </Button>
            <Button
              danger
              onClick={() => handleDelete(record.id)}
              loading={deleteLoading === record.id}
              disabled={record.root}
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
          添加用户
        </Button>
        <Button
          disabled={selected.length === 0 || selectedIncludesRoot}
          danger
          onClick={() => handleDeleteMultiple(selected)}
          loading={deleteMultipleLoading}
        >
          批量删除
        </Button>
      </Space>
      <Table
        rowKey='id'
        dataSource={toJS(user.users)}
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
        title='添加用户'
        visible={addModal}
        footer={null}
        onCancel={closeAddModal}
      >
        <UserForm
          mode='add'
          onCancel={closeAddModal}
          onSubmitDone={closeAddModal}
        />
      </Modal>
      <Modal
        title='编辑用户'
        visible={!!editModal}
        footer={null}
        onCancel={closeEditModal}
      >
        <UserForm
          mode='edit'
          data={editModal}
          onCancel={closeEditModal}
          onSubmitDone={closeEditModal}
        />
      </Modal>
    </div>
  );
}

export default observer(Users);
