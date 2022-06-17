import styles from './Logs.module.scss';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, message, Pagination, Select, Table } from 'antd';
import DatePicker from '../../components/basics/DatePicker';
import { api } from '../../utils/axios';
import Label from '../../components/basics/Label';
import dayjs from 'dayjs';

function Logs() {
  const [times, setTimes] = useState<any>([]);
  const handleTimesChange = useCallback((e) => {
    if (e && e.length === 2) {
      const start = e[0];
      const end = e[1];
      if (start && end) {
        setTimes([start.startOf('day'), end.endOf('day')]);
      } else {
        setTimes([]);
      }
    }
  }, []);
  const [pid, setPID] = useState('');
  const handlePIDChange = useCallback((e: any) => {
    if (typeof e.target.value === 'string') {
      setPID(e.target.value.trim());
    } else {
      setPID('');
    }
  }, []);
  const [level, setLevel] = useState('all');
  const handleLevelChange = useCallback((e: string) => {
    setLevel(e);
  }, []);
  const [type, setType] = useState('all');
  const handleTypeChange = useCallback((e: string) => {
    setType(e);
  }, []);
  const [msg, setMsg] = useState('');
  const handleMsgChange = useCallback((e: any) => {
    if (typeof e.target.value === 'string') {
      setMsg(e.target.value.trim());
    } else {
      setMsg('');
    }
  }, []);
  const [payload, setPayload] = useState('');
  const handlePayloadChange = useCallback((e: any) => {
    if (typeof e.target.value === 'string') {
      setPayload(e.target.value.trim());
    } else {
      setPayload('');
    }
  }, []);
  const handleResetFilter = useCallback(() => {
    setTimes([]);
    setPID('');
    setLevel('all');
    setType('all');
    setMsg('');
    setPayload('');
  }, []);

  const [listloading, setListLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pagesize, setPagesize] = useState<number>(10);
  const handlePageChange = useCallback((page: number, pagesize: number) => {
    setPage(page);
    setPagesize(pagesize);
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setListLoading(true);
      const params = { page, pagesize } as any;
      times && times.length === 2 && (params.from = times[0].valueOf());
      times && times.length === 2 && (params.to = times[1].valueOf());
      pid && (params.pid = pid);
      level !== 'all' && (params.level = level);
      type !== 'all' && (params.type = type);
      msg && (params.msg = msg);
      payload && (params.payload = payload);
      const res = await api.get(`/logs`, { params });
      const data = res.data as any;
      if (data.total && !data.data.length) {
        setPage(1);
      }
      setData(data.data);
      setTotal(data.total);
      setListLoading(false);
    } catch {
      message.error('获取日志失败');
      setListLoading(false);
    }
  }, [page, pagesize, times, pid, level, type, msg, payload]);
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const columns = useMemo(() => {
    const arr = [
      {
        title: '时间',
        key: 'time',
        render: (record: any) =>
          dayjs(record.time).format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        title: 'PID',
        key: 'pid',
        render: (record: any) => <Label>{record.pid}</Label>,
      },
      {
        title: '级别',
        key: 'level',
        render: (record: any) => record.level.toUpperCase(),
      },
      {
        title: '类型',
        key: 'type',
        render: (record: any) =>
          record.type === 'server'
            ? '服务器'
            : record.type === 'auth'
            ? '身份验证'
            : record.type === 'user'
            ? '用户管理'
            : record.type === 'site'
            ? '站点管理'
            : record.type === 'collector'
            ? '数据收集'
            : '未知',
      },
      {
        title: '信息',
        key: 'msg',
        render: (record: any) => <Label>{record.msg}</Label>,
      },
      {
        title: '日志数据',
        key: 'payload',
        render: (record: any) => <Label>{record.payload}</Label>,
      },
    ];
    return arr;
  }, []);

  return (
    <div>
      <div className={styles.filters}>
        <span>时间范围</span>
        <DatePicker.RangePicker
          showTime
          value={times}
          onChange={handleTimesChange}
        />
        <span>PID</span>
        <Input className={styles.pidi} value={pid} onChange={handlePIDChange} />
      </div>
      <div className={styles.filters}>
        <span>级别</span>
        <Select
          className={styles.leveli}
          value={level}
          onChange={handleLevelChange}
        >
          <Select.Option value='all'>全部</Select.Option>
          <Select.Option value='info'>INFO</Select.Option>
          <Select.Option value='warn'>WARN</Select.Option>
          <Select.Option value='error'>ERROR</Select.Option>
        </Select>
        <span>类型</span>
        <Select
          className={styles.typei}
          value={type}
          onChange={handleTypeChange}
        >
          <Select.Option value='all'>全部</Select.Option>
          <Select.Option value='server'>服务器</Select.Option>
          <Select.Option value='auth'>身份验证</Select.Option>
          <Select.Option value='user'>用户管理</Select.Option>
          <Select.Option value='site'>站点管理</Select.Option>
          <Select.Option value='collector'>数据收集</Select.Option>
        </Select>
        <span>信息</span>
        <Input className={styles.msgi} value={msg} onChange={handleMsgChange} />
      </div>
      <div className={styles.filters}>
        <span>日志数据</span>
        <Input
          className={styles.pldi}
          value={payload}
          onChange={handlePayloadChange}
        />
        <Button className={styles.bbtn} onClick={handleResetFilter}>
          重置
        </Button>
      </div>
      <div className={styles.filters}>
        {!!total && (
          <Pagination
            showSizeChanger
            total={total}
            current={page}
            pageSizeOptions={['10', '20', '50', '100']}
            pageSize={pagesize}
            onChange={handlePageChange}
          />
        )}
      </div>
      <div className={styles.tabel}>
        <Table
          className={styles.table}
          loading={listloading}
          size='small'
          rowKey='_id'
          dataSource={data}
          columns={columns as any}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
}

export default Logs;
