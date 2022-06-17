import styles from './index.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { message, Pagination, Select, Spin, Table } from 'antd';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import Controller from '../../components/layouts/Controller';
import Title from '../../components/miscs/Title';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { VitalsData, VitalsItem, VitalsSiteData } from '../../utils/types';
import Label from '../../components/basics/Label';
import NESChart from './NESChart';
import SiteCircle from './SiteCircle';
import VitalsPanel from './VitalsPanel';

function Vitals() {
  const { curSite } = useCurSite();

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pagesize, setPagesize] = useState<number>(5);
  const handlePageChange = useCallback((page: number, pagesize: number) => {
    setPage(page);
    setPagesize(pagesize);
  }, []);

  // filters
  const [mode, setMode] = useState('p75');
  const handleSortChange = useCallback((v: string) => {
    setMode(v);
  }, []);
  const [length, setLength] = useState('14');
  const handleLengthChange = useCallback((v: string) => {
    setLength(v);
  }, []);

  const times = useMemo<[Dayjs, Dayjs]>(
    () => [
      dayjs('2022-05-15T23:00:00+08:00').subtract(Number(length), 'day'),
      dayjs('2022-05-15T23:00:00+08:00'),
    ],
    [length]
  );

  const [singleloading, setSingleLoading] = useState(false);
  const [singleData, setSingleData] = useState<VitalsSiteData | null>(null);
  const [listloading, setListLoading] = useState(false);
  const [data, setData] = useState<VitalsItem[]>([]);

  const [filteredValue, setFilteredValue] = useState<string[]>([]);
  const handleFilterChange = useCallback((_, filters) => {
    if (filters.path && Array.isArray(filters.path)) {
      setFilteredValue(filters.path);
    } else {
      setFilteredValue([]);
    }
  }, []);

  const fetchSite = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      const params = {
        from: times[0].valueOf(),
        to: times[1].valueOf(),
        mode,
      } as any;
      if (filteredValue.length) {
        params.pathname = filteredValue[0];
      }
      setSingleLoading(true);
      const res = await api.get(`/metrics/${curSite.id}/vitals/single`, {
        params,
      });
      const data = res.data as VitalsSiteData;
      setSingleData(data);
      setSingleLoading(false);
    } catch {
      message.error('获取 Web Vitals 数据失败');
      setSingleLoading(false);
    }
  }, [curSite, filteredValue, mode, times]);
  useEffect(() => {
    fetchSite();
  }, [fetchSite]);

  const fetchList = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      setListLoading(true);
      const res = await api.get(`/metrics/${curSite.id}/vitals/list`, {
        params: {
          from: times[0].valueOf(),
          to: times[1].valueOf(),
          mode,
          page,
          pagesize,
        },
      });
      const data = res.data as VitalsData;
      if (data.total && !data.data.length) {
        setPage(1);
      }
      setData(data.data);
      setTotal(data.total);
      setListLoading(false);
    } catch {
      message.error('获取 Web Vitals 数据失败');
      setListLoading(false);
    }
  }, [curSite, mode, page, pagesize, times]);
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const columns = useMemo(() => {
    return [
      {
        title: '访问路径',
        key: 'path',
        render: (record: VitalsItem) => <Label>{record.path}</Label>,
        filters: data.map((item) => ({ text: item.path, value: item.path })),
        filteredValue,
        onFilter: (value: string, record: VitalsItem) => record.path === value,
        filterSearch: true,
        filterMultiple: false,
      },
      {
        title: 'NES',
        key: 'nes',
        render: (record: VitalsItem) => record.nes.toFixed(2),
      },
      {
        title: 'FCP',
        key: 'fcp',
        render: (record: VitalsItem) => Math.ceil(record.fcp || 0),
      },
      {
        title: 'LCP',
        key: 'lcp',
        render: (record: VitalsItem) => Math.ceil(record.lcp || 0),
      },
      {
        title: 'CLS',
        key: 'cls',
        render: (record: VitalsItem) => (record.cls || 0).toFixed(4),
      },
      {
        title: 'FID',
        key: 'fid',
        render: (record: VitalsItem) => Math.ceil(record.fid || 0),
      },
      {
        title: 'TTFB',
        key: 'ttfb',
        render: (record: VitalsItem) => Math.ceil(record.ttfb || 0),
      },
      {
        title: '数据点位数',
        key: 'points',
        render: (record: VitalsItem) => record.count,
      },
    ];
  }, [data, filteredValue]);

  return (
    <div className={styles.container}>
      <Title>Web Vitals</Title>
      <Controller mode='none' title='Web Vitals'>
        {!!total && (
          <Pagination
            showSizeChanger
            total={total}
            current={page}
            pageSizeOptions={['5', '10']}
            pageSize={pagesize}
            onChange={handlePageChange}
          />
        )}
      </Controller>
      <div className={styles.filter}>
        <span className={styles.label}>统计模式</span>
        <Select
          className={styles.sinput}
          value={mode}
          onChange={handleSortChange}
        >
          <Select.Option key='p75' value='p75'>
            P75
          </Select.Option>
          <Select.Option key='p90' value='p90'>
            P90
          </Select.Option>
          <Select.Option key='p95' value='p95'>
            P95
          </Select.Option>
          <Select.Option key='p99' value='p99'>
            P99
          </Select.Option>
          <Select.Option key='avg' value='avg'>
            平均值
          </Select.Option>
        </Select>
        <span className={styles.label}>统计时长</span>
        <Select
          className={styles.sinput}
          value={length}
          onChange={handleLengthChange}
        >
          <Select.Option key='14' value='14'>
            14 天
          </Select.Option>
          <Select.Option key='7' value='7'>
            7 天
          </Select.Option>
          <Select.Option key='1' value='1'>
            1 天
          </Select.Option>
        </Select>
      </div>
      <div className={styles.res}>
        <div className={styles.resscore}>
          <Spin spinning={singleloading}>
            <div className={styles.restitle}>真实体验分数（NES）</div>
            <SiteCircle num={Math.ceil(singleData?.nes || 0)} />
            <div className={styles.resp}>{singleData?.count || 0} 数据点位</div>
          </Spin>
        </div>
        <NESChart times={times} mode={mode} />
      </div>
      <VitalsPanel data={singleData} times={times} mode={mode} />
      <div className={styles.content}>
        <Table
          className={styles.table}
          loading={listloading}
          onChange={handleFilterChange}
          size='small'
          rowKey='path'
          dataSource={data}
          columns={columns as any}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
}

export default observer(Vitals);
