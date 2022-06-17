import styles from './index.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { message, Table, Pagination, Input, Button, Select } from 'antd';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import Controller from '../../components/layouts/Controller';
import Title from '../../components/miscs/Title';
import { api } from '../../utils/axios';
import useCurSite from '../../hooks/useCurSite';
import Label from '../../components/basics/Label';
import useCountry from '../../hooks/useCountry';
import { LogData, LogItem, RealtimeData } from '../../utils/types';
import DatePicker from '../../components/basics/DatePicker';
import SessionModal from './SessionModal';
import { fmtPlatform, fmtStatus, platform } from '../../utils/format';
import useTimezone from '../../hooks/useTimezone';
import LogChart from './LogChart';

function Log() {
  const { curSite } = useCurSite();
  const { tz } = useTimezone();
  const { country } = useCountry();

  const [time, setTime] = useState<Dayjs>(dayjs('2022-05-15T23:00:00+08:00'));
  const handleTimeChange = useCallback((dayjs) => {
    setTime(dayjs);
  }, []);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pagesize, setPagesize] = useState<number>(10);
  const handlePageChange = useCallback((page: number, pagesize: number) => {
    setPage(page);
    setPagesize(pagesize);
  }, []);

  // filters
  const [timerg, setTimeRG] = useState<Dayjs[]>([]);
  const handleTimeRGChange = useCallback((e: [Dayjs, Dayjs]) => {
    e ? setTimeRG(e) : setTimeRG([]);
  }, []);
  const [fp, setFP] = useState('');
  const handleFPChange = useCallback((e: any) => {
    if (typeof e.target.value === 'string') {
      setFP(e.target.value.trim());
    } else {
      setFP('');
    }
  }, []);
  const [rg, setRG] = useState('');
  const handleRGChange = useCallback((v: string) => {
    setRG(v);
  }, []);
  const [ip, setIP] = useState('');
  const handleIPChange = useCallback((e: any) => {
    if (typeof e.target.value === 'string') {
      setIP(e.target.value.trim());
    } else {
      setIP('');
    }
  }, []);
  const [plat, setPlat] = useState('');
  const handlePlatChange = useCallback((v: string) => {
    setPlat(v);
  }, []);
  const [path, setPath] = useState('');
  const handlePathChange = useCallback((e: any) => {
    if (typeof e.target.value === 'string') {
      setPath(e.target.value.trim());
    } else {
      setPath('');
    }
  }, []);
  const handleResetFilter = useCallback(() => {
    setTimeRG([]);
    setFP('');
    setRG('');
    setIP('');
    setPlat('');
    setPath('');
  }, []);

  const [loading, setLoading] = useState(false);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);

  // fetch list on site change/realtime mode update
  const fetchRealtime = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      const res = await api.get(`/metrics/${curSite.id}/log/realtime`, {
        params: {
          to: dayjs().valueOf(),
          tz,
        },
      });
      const data = res.data as RealtimeData;
      setRealtime(data);
    } catch {
      message.error('获取实时活跃访客数失败');
    }
  }, [curSite, tz]);

  useEffect(() => {
    fetchRealtime();
  }, [fetchRealtime]);

  const fetchProps = useMemo(() => {
    const _path = `/metrics/${curSite?.id}/log/list`;
    const params = {
      to: time.valueOf(),
      page,
      pagesize,
      tz,
    } as any;
    if (timerg.length === 2) {
      params.to = time
        .set('h', timerg[1].hour())
        .set('m', timerg[1].minute())
        .set('s', timerg[1].second())
        .set('ms', timerg[1].millisecond())
        .valueOf();
      params.from = time
        .set('h', timerg[0].hour())
        .set('m', timerg[0].minute())
        .set('s', timerg[0].second())
        .set('ms', timerg[0].millisecond())
        .valueOf();
    }
    fp && (params.fp = fp);
    rg && (params.location = rg);
    ip && (params.ip = ip);
    plat && (params.platform = plat);
    path && (params.pathname = path);
    return { path: _path, params };
  }, [curSite?.id, fp, ip, page, pagesize, path, plat, rg, time, timerg, tz]);
  const fetchList = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(fetchProps.path, {
        params: fetchProps.params,
      });
      const data = res.data as LogData;
      if (data.total && !data.data.length) {
        setPage(1);
      }
      setLogs(data.data);
      setTotal(data.total);
      setLoading(false);
    } catch {
      message.error('获取访问记录失败');
      setLoading(false);
    }
  }, [curSite, fetchProps.path, fetchProps.params]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const [sessionModal, setSessionModal] = useState('');

  const columns = useMemo(() => {
    return [
      {
        title: '访问时间',
        key: '_created',
        render: (record: LogItem) =>
          dayjs(record._created).format('YYYY-MM-DD HH:mm:ss'),
        fixed: 'left',
      },
      {
        title: '唯一标识',
        key: '_fp',
        render: (record: LogItem) => (
          <Label onClick={() => setSessionModal(record._fp)}>
            {record._fp}
          </Label>
        ),
      },
      {
        title: '地区',
        key: 'location',
        render: (record: LogItem) =>
          (country ? country[record.location] : record.location) ||
          record.location,
      },
      {
        title: 'IP',
        key: 'ip',
        render: (record: LogItem) => <Label>{record.ip}</Label>,
      },
      {
        title: '设备类型',
        key: 'platform',
        render: (record: LogItem) => fmtPlatform(record.platform),
      },
      {
        title: '访问路径',
        key: 'pathname',
        render: (record: LogItem) => <Label>{record.pathname}</Label>,
      },
      {
        title: '状态',
        key: 'status',
        fixed: 'right',
        render: (record: LogItem) => fmtStatus(record.status),
      },
    ];
  }, [country]);

  return (
    <div className={styles.container}>
      <Title>访问记录</Title>
      <Controller
        mode='single'
        title='访问记录'
        value={time}
        onChange={handleTimeChange}
        exporter={fetchProps}
      >
        {!!total && (
          <Pagination
            showSizeChanger
            total={total}
            current={page}
            pageSize={pagesize}
            onChange={handlePageChange}
          />
        )}
      </Controller>
      <div className={styles.content}>
        <LogChart
          data={
            realtime || {
              tenMins: '-',
              oneHour: '-',
              halfDay: '-',
              perHour: new Array(24).fill(0),
            }
          }
        />
        <div className={styles.filter}>
          <span className={styles.label}>时间范围</span>
          <DatePicker.RangePicker
            picker='time'
            className={styles.timeinput}
            value={timerg as any}
            onChange={handleTimeRGChange as any}
          />
          <span className={styles.label}>唯一标识</span>
          <Input
            className={styles.fpinput}
            value={fp}
            onChange={handleFPChange}
          />
          <span className={styles.label}>地区</span>
          <Select
            className={styles.rginput}
            value={rg}
            onChange={handleRGChange}
          >
            {Object.entries(country || {}).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                {value as string}
              </Select.Option>
            ))}
          </Select>
          <span className={styles.label}>IP</span>
          <Input
            className={styles.ipinput}
            value={ip}
            onChange={handleIPChange}
          />
          <span className={styles.label}>设备类型</span>
          <Select
            className={styles.pinput}
            value={plat}
            onChange={handlePlatChange}
          >
            {Object.entries(platform || {}).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                {value as string}
              </Select.Option>
            ))}
          </Select>
          <span className={styles.label}>访问路径</span>
          <Input
            className={styles.pathinput}
            value={path}
            onChange={handlePathChange}
          />
          <Button onClick={handleResetFilter}>重置</Button>
        </div>
        <Table
          className={styles.table}
          loading={loading}
          size='small'
          rowKey={(record: LogItem) => record._created + record._fp}
          dataSource={logs}
          columns={columns as any}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>
      <SessionModal sid={sessionModal} onCancel={() => setSessionModal('')} />
    </div>
  );
}

export default observer(Log);
