import styles from './index.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { message, Table } from 'antd';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import Controller from '../../components/layouts/Controller';
import Title from '../../components/miscs/Title';
import { api } from '../../utils/axios';
import { TrendData, TrendItem } from '../../utils/types';
import { numSorter } from '../../utils/sorter';
import useCurSite from '../../hooks/useCurSite';
import useTimezone from '../../hooks/useTimezone';
import RangesChart from './RangesChart';

function Trend() {
  const { curSite } = useCurSite();
  const { tz } = useTimezone();

  const [times, setTimes] = useState<[Dayjs, Dayjs]>([
    dayjs('2022-05-15T23:00:00+08:00').subtract(7, 'day').startOf('day'),
    dayjs('2022-05-15T23:00:00+08:00').subtract(1, 'day').endOf('day'),
  ]);
  const handleTimeChange = useCallback((range) => {
    setTimes(range);
  }, []);
  const diff = useMemo(() => times[1].diff(times[0], 'day'), [times]);

  const [listloading, setListLoading] = useState(false);
  const [data, setData] = useState<TrendData>([]);

  const fetchProps = useMemo(() => {
    const _path = `/metrics/${curSite?.id}/trend`;
    const params = {
      from: times[0].valueOf(),
      to: times[1].valueOf(),
      tz,
    } as any;
    return { path: _path, params };
  }, [curSite?.id, times, tz]);

  const fetchList = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      setListLoading(true);
      const res = await api.get(fetchProps.path, {
        params: fetchProps.params,
      });
      const data = res.data as TrendData;
      setData(data);
      setListLoading(false);
    } catch {
      message.error('获取站点趋势失败');
      setListLoading(false);
    }
  }, [curSite, fetchProps]);
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const renderDateRange = useCallback(
    (date: string) => {
      if (diff >= 1) {
        return (
          dayjs(`2000-${date}`).format('MM-DD') +
          ' ~ ' +
          dayjs(`2000-${date}`).add(1, 'd').format('MM-DD')
        );
      } else {
        return (
          dayjs(`2000-01-01 ${date}:00`).format('HH:mm') +
          ' ~ ' +
          dayjs(`2000-01-01 ${date}:00`).add(1, 'h').format('HH:mm')
        );
      }
    },
    [diff]
  );

  const [filteredValue, setFilteredValue] = useState<string[]>([]);
  const handleFilterChange = useCallback((_, filters) => {
    if (filters.date && Array.isArray(filters.date)) {
      setFilteredValue(filters.date);
    } else {
      setFilteredValue([]);
    }
  }, []);

  const columns = useMemo(() => {
    return [
      {
        title: diff >= 1 ? '日期区间' : '时间区间',
        key: 'date',
        render: (record: TrendItem) => renderDateRange(record.date),
        filters: data.map((item) => ({
          text: renderDateRange(item.date),
          value: item.date,
        })),
        filteredValue,
        onFilter: (value: string, record: TrendItem) => record.date === value,
        filterSearch: true,
      },
      {
        title: '访问次数（PV）',
        key: 'pv',
        dataIndex: 'pv',
        sorter: (a: TrendItem, b: TrendItem) => numSorter(a.pv, b.pv),
      },
      {
        title: '访客数（UV）',
        key: 'uv',
        dataIndex: 'uv',
        sorter: (a: TrendItem, b: TrendItem) => numSorter(a.uv, b.uv),
      },
      {
        title: '错误数',
        key: 'es',
        dataIndex: 'es',
        sorter: (a: TrendItem, b: TrendItem) => numSorter(a.es, b.es),
      },
      {
        title: '独立错误',
        key: 'des',
        dataIndex: 'des',
        sorter: (a: TrendItem, b: TrendItem) => numSorter(a.des, b.des),
      },
      {
        title: 'Web Vitals 数据量',
        key: 'vt',
        dataIndex: 'vt',
        sorter: (a: TrendItem, b: TrendItem) => numSorter(a.vt, b.vt),
      },
    ];
  }, [data, diff, filteredValue, renderDateRange]);

  return (
    <div className={styles.container}>
      <Title>站点趋势</Title>
      <Controller
        mode='range'
        title='站点趋势'
        value={times}
        exporter={fetchProps}
        onChange={handleTimeChange}
      />
      <div className={styles.content}>
        <RangesChart data={data} times={times} filterd={filteredValue} />
        <Table
          className={styles.table}
          loading={listloading}
          onChange={handleFilterChange}
          size='small'
          rowKey='date'
          dataSource={data}
          columns={columns as any}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
}

export default observer(Trend);
