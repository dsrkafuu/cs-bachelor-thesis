import styles from './index.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Input,
  message,
  Pagination,
  Radio,
  RadioChangeEvent,
  Select,
  Space,
  Table,
} from 'antd';
import dayjs from '../../../lib/dayjs';
import Controller from '../../components/layouts/Controller';
import Title from '../../components/miscs/Title';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { ErrorsData, ErrorsItem } from '../../utils/types';
import Label from '../../components/basics/Label';
import { errtype, fmtErrtype } from '../../utils/format';

function Errors() {
  const { curSite } = useCurSite();

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pagesize, setPagesize] = useState<number>(10);
  const handlePageChange = useCallback((page: number, pagesize: number) => {
    setPage(page);
    setPagesize(pagesize);
  }, []);

  const options = useMemo(
    () => [
      { label: '未确认', value: 'unresolved' },
      { label: '已确认', value: 'reviewed' },
      { label: '已修复', value: 'resolved' },
    ],
    []
  );
  const [status, setStatus] = useState('unresolved');
  const handleStatusChange = useCallback((e: RadioChangeEvent) => {
    setStatus(e.target.value);
  }, []);

  // filters
  const [type, setType] = useState('all');
  const handleTypeChange = useCallback((v: string) => {
    setType(v);
  }, []);
  const [name, setName] = useState('');
  const handleNameChange = useCallback((e: any) => {
    if (typeof e.target.value === 'string') {
      setName(e.target.value.trim());
    } else {
      setName('');
    }
  }, []);
  const [msg, setMsg] = useState('');
  const handleMsgChange = useCallback((e: any) => {
    if (typeof e.target.value === 'string') {
      setMsg(e.target.value.trim());
    } else {
      setMsg('');
    }
  }, []);
  const handleResetFilter = useCallback(() => {
    setType('all');
    setName('');
    setMsg('');
  }, []);

  const fetchList = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/metrics/${curSite.id}/errors/list`, {
        params: {
          status,
          page,
          pagesize,
          type: type === 'all' ? undefined : type,
          name,
          message: msg,
        },
      });
      const data = res.data as ErrorsData;
      if (data.total && !data.data.length) {
        setPage(1);
      }
      setData(data.data);
      setTotal(data.total);
      setLoading(false);
    } catch {
      message.error('获取错误列表数据失败');
      setLoading(false);
    }
  }, [curSite, msg, name, page, pagesize, status, type]);
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const putStatus = useCallback(
    async (eid: string, newStatus: string) => {
      if (!curSite) {
        return 0;
      }
      const res = await api.put(`/metrics/${curSite.id}/errors/${eid}`, {
        status: newStatus,
      });
      const data = res.data as any;
      const modified = data.modifiedCount as number;
      return modified;
    },
    [curSite]
  );
  const handlePutStatus = useCallback(
    async (eids: string[], newStatus: string) => {
      try {
        setLoading(true);
        const ress = await Promise.all(
          eids.map((eid) => putStatus(eid, newStatus))
        );
        const modified = ress.reduce((acc, cur) => acc + cur, 0);
        if (modified > 0) {
          message.success(`修改 ${modified} 个错误状态成功`);
          fetchList();
        } else {
          message.error('修改错误状态失败');
          setLoading(false);
        }
      } catch {
        message.error('修改错误状态失败');
        setLoading(false);
      }
    },
    [fetchList, putStatus]
  );

  const delItem = useCallback(
    async (eid: string) => {
      if (!curSite) {
        return 0;
      }
      const res = await api.delete(`/metrics/${curSite.id}/errors/${eid}`);
      const data = res.data as any;
      const deleted = data.deletedCount as number;
      return deleted;
    },
    [curSite]
  );
  const handleDelItem = useCallback(
    async (eids: string[]) => {
      try {
        setLoading(true);
        const ress = await Promise.all(eids.map((eid) => delItem(eid)));
        const deleted = ress.reduce((acc, cur) => acc + cur, 0);
        if (deleted > 0) {
          message.success(`删除 ${deleted} 个错误成功`);
          fetchList();
        } else {
          message.error('删除错误失败');
          setLoading(false);
        }
      } catch {
        message.error('删除错误失败');
        setLoading(false);
      }
    },
    [delItem, fetchList]
  );

  const [selectedEIDs, setSelectedEIDs] = useState<string[]>([]);
  const handleRowSelectionChange = useCallback((eids: any[]) => {
    setSelectedEIDs(eids);
  }, []);
  const disableBtns = useMemo(
    () => !selectedEIDs.length,
    [selectedEIDs.length]
  );

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ErrorsItem[]>([]);

  const columns = useMemo(() => {
    return [
      {
        title: '错误信息',
        key: 'error',
        render: (record: ErrorsItem) => (
          <div>
            <div>
              <span className={styles.elabel}>
                <Label>{fmtErrtype(record.type)}</Label>
              </span>
              <span className={styles.idlabel}>
                <Label>{record.eid}</Label>
              </span>
              <Link to={`/errors/${record.eid}`} className={styles.ename}>
                {record.name}
              </Link>
            </div>
            <div className={styles.emessage}>{record.message}</div>
          </div>
        ),
      },
      {
        title: '错误次数',
        key: 'pv',
        dataIndex: 'pv',
        fixed: 'right',
      },
      {
        title: '访客数',
        key: 'uv',
        dataIndex: 'uv',
        fixed: 'right',
      },
      {
        title: '日期/时间',
        key: 'date',
        fixed: 'right',
        render: (record: ErrorsItem) => (
          <div>
            <div>
              <span className={styles.tlabel}>最后出现</span>
              <span>{dayjs(record.last).format('YYYY-MM-DD HH:MM')}</span>
            </div>
            <div>
              <span className={styles.tlabel}>首次出现</span>
              <span>{dayjs(record.first).format('YYYY-MM-DD HH:MM')}</span>
            </div>
          </div>
        ),
      },
    ];
  }, []);

  return (
    <div className={styles.container}>
      <Title>错误监控</Title>
      <Controller mode='none' title='错误监控'>
        {!!total && (
          <Pagination
            showSizeChanger
            total={total}
            current={page}
            pageSizeOptions={['5', '10', '20']}
            pageSize={pagesize}
            onChange={handlePageChange}
          />
        )}
      </Controller>
      <div className={styles.content}>
        <div className={styles.filter}>
          <span className={styles.label}>类型</span>
          <Select
            className={styles.sinput}
            value={type}
            onChange={handleTypeChange}
          >
            <Select.Option key='all' value='all'>
              全部
            </Select.Option>
            {Object.entries(errtype).map(([k, v]) => (
              <Select.Option key={k} value={k}>
                {v as any}
              </Select.Option>
            ))}
          </Select>
          <span className={styles.label}>名称</span>
          <Input
            className={styles.ninput}
            value={name}
            onChange={handleNameChange}
          />
          <span className={styles.label}>信息</span>
          <Input
            className={styles.minput}
            value={msg}
            onChange={handleMsgChange}
          />
          <Button onClick={handleResetFilter}>重置</Button>
        </div>
        <Space>
          <Radio.Group
            optionType='button'
            options={options}
            value={status}
            onChange={handleStatusChange}
          />
          {status !== 'unresolved' && (
            <Button
              disabled={disableBtns}
              onClick={() => handlePutStatus(selectedEIDs, 'unresolved')}
            >
              标为未确认
            </Button>
          )}
          {status !== 'reviewed' && (
            <Button
              type={status === 'unresolved' ? 'primary' : 'default'}
              disabled={disableBtns}
              onClick={() => handlePutStatus(selectedEIDs, 'reviewed')}
            >
              标为已确认
            </Button>
          )}
          {status !== 'resolved' && (
            <Button
              type={status === 'reviewed' ? 'primary' : 'default'}
              disabled={disableBtns}
              onClick={() => handlePutStatus(selectedEIDs, 'resolved')}
            >
              标为已修复
            </Button>
          )}
          <Button
            danger
            disabled={disableBtns}
            onClick={() => handleDelItem(selectedEIDs)}
          >
            删除
          </Button>
        </Space>
        <Table
          className={styles.table}
          loading={loading}
          size='small'
          rowKey='eid'
          dataSource={data}
          columns={columns as any}
          pagination={false}
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys: selectedEIDs,
            onChange: handleRowSelectionChange,
          }}
        />
      </div>
    </div>
  );
}

export default observer(Errors);
