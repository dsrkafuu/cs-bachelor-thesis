import styles from './index.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { message, Spin, Table } from 'antd';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import Controller from '../../components/layouts/Controller';
import Title from '../../components/miscs/Title';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { LocationData, LocationItem } from '../../utils/types';
import { numSorter } from '../../utils/sorter';
import useCountry from '../../hooks/useCountry';
import useTimezone from '../../hooks/useTimezone';
import WorldMap from './WorldMap';

function Location() {
  const { curSite } = useCurSite();
  const { tz } = useTimezone();
  const { country } = useCountry();

  const [times, setTimes] = useState<[Dayjs, Dayjs]>([
    dayjs('2022-05-15T23:00:00+08:00').subtract(30, 'day').startOf('day'),
    dayjs('2022-05-15T23:00:00+08:00').subtract(1, 'day').endOf('day'),
  ]);
  const handleTimeChange = useCallback((range) => {
    setTimes(range);
  }, []);

  const [listloading, setListLoading] = useState(false);
  const [data, setData] = useState<LocationData>([]);

  const fetchProps = useMemo(() => {
    const _path = `/metrics/${curSite?.id}/location`;
    const params = {
      from: times[0].valueOf(),
      to: times[1].valueOf(),
      tz,
    };
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
      const data = res.data as LocationData;
      setData(data);
      setListLoading(false);
    } catch {
      message.error('获取国家/地区数据失败');
      setListLoading(false);
    }
  }, [curSite, fetchProps.path, fetchProps.params]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const [filteredValue, setFilteredValue] = useState<string[]>([]);
  const handleFilterChange = useCallback((_, filters) => {
    if (filters.c && Array.isArray(filters.c)) {
      setFilteredValue(filters.c);
    } else {
      setFilteredValue([]);
    }
  }, []);

  const columns = useMemo(() => {
    return [
      {
        title: '国家/地区',
        key: 'c',
        render: (record: LocationItem) => country[record.c] || '未知',
        filters: data.map((item) => ({
          text: country[item.c] || '未知',
          value: item.c,
        })),
        filteredValue,
        onFilter: (value: string, record: LocationItem) => record.c === value,
        filterSearch: true,
      },
      {
        title: '访问次数（PV）',
        key: 'pv',
        dataIndex: 'pv',
        sorter: (a: LocationItem, b: LocationItem) => numSorter(a.pv, b.pv),
      },
      {
        title: '访客数（UV）',
        key: 'uv',
        dataIndex: 'uv',
        sorter: (a: LocationItem, b: LocationItem) => numSorter(a.uv, b.uv),
      },
    ];
  }, [country, data, filteredValue]);

  return (
    <div className={styles.container}>
      <Title>国家/地区</Title>
      <Controller
        exporter={fetchProps}
        mode='range'
        title='国家/地区'
        value={times}
        onChange={handleTimeChange}
      />
      <div className={styles.content}>
        <div className={styles.map}>
          <Spin spinning={listloading}>
            <WorldMap data={data} filtered={filteredValue} />
          </Spin>
        </div>
        <div className={styles.wrapper}>
          <Table
            className={styles.table}
            loading={listloading}
            onChange={handleFilterChange}
            size='small'
            rowKey='c'
            dataSource={data}
            columns={columns as any}
            pagination={{ defaultPageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        </div>
      </div>
    </div>
  );
}

export default observer(Location);
