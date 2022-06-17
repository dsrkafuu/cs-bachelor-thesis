import styles from './index.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, message, Select, Table } from 'antd';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import Controller from '../../components/layouts/Controller';
import Title from '../../components/miscs/Title';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { RefregData, RefregItem } from '../../utils/types';
import { numSorter } from '../../utils/sorter';
import { fmtReferrer } from '../../utils/format';
import useTimezone from '../../hooks/useTimezone';
import RangesChart from './RangesChart';
import SingleChart from './SingleChart';
import PieChart from './PieChart';
import SearchChart from './SearchChart';

function Refreg() {
  const { curSite } = useCurSite();
  const { tz } = useTimezone();

  const [times, setTimes] = useState<[Dayjs, Dayjs]>([
    dayjs('2022-05-15T23:00:00+08:00').subtract(7, 'day').startOf('day'),
    dayjs('2022-05-15T23:00:00+08:00').subtract(1, 'day').endOf('day'),
  ]);
  const handleTimeChange = useCallback((range) => {
    setTimes(range);
  }, []);

  // filters
  const [sort, setSort] = useState('pv');
  const handleSortChange = useCallback((v: string) => {
    setSort(v);
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
    setSort('uv');
    setPath('');
  }, []);

  const [listloading, setListLoading] = useState(false);
  const [data, setData] = useState<RefregData | null>(null);

  const fetchList = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      setListLoading(true);
      const res = await api.get(`/metrics/${curSite.id}/refreg/list`, {
        params: {
          from: times[0].valueOf(),
          to: times[1].valueOf(),
          tz,
          pathname: path,
        },
      });
      const data = res.data as RefregData;
      setData(data);
      setListLoading(false);
    } catch {
      message.error('获取来路情况失败');
      setListLoading(false);
    }
  }, [curSite, times, tz, path]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const dataRows = useMemo(() => {
    if (!data) {
      return [];
    }
    return Object.keys(data).map((key) => {
      const item = (data as any)[key] as RefregItem;
      return { type: fmtReferrer(key), ...item };
    });
  }, [data]);
  const columns = useMemo(() => {
    return [
      {
        title: '来路类型',
        key: 'type',
        dataIndex: 'type',
      },
      {
        title: '访问次数（PV）',
        key: 'pv',
        dataIndex: 'pv',
        sorter: (a: RefregItem, b: RefregItem) => numSorter(a.pv, b.pv),
      },
      {
        title: '访客数（UV）',
        key: 'uv',
        dataIndex: 'uv',
        sorter: (a: RefregItem, b: RefregItem) => numSorter(a.uv, b.uv),
      },
    ];
  }, []);

  return (
    <div className={styles.container}>
      <Title>来路分类</Title>
      <Controller
        mode='range'
        title='来路分类'
        value={times}
        onChange={handleTimeChange}
      />
      <div className={styles.content}>
        {times[1].diff(times[0], 'day') >= 1 ? (
          <RangesChart times={times} mkey={sort} />
        ) : (
          <SingleChart data={data} />
        )}
        <div className={styles.fcharts}>
          <PieChart data={data} mkey={sort} />
          <SearchChart times={times} mkey={sort} />
        </div>
        <div className={styles.filter}>
          {times[1].diff(times[0], 'day') >= 1 ? (
            <>
              <span className={styles.label}>图表主键</span>
              <Select
                className={styles.sinput}
                value={sort}
                onChange={handleSortChange}
              >
                <Select.Option key='pv' value='pv'>
                  访问次数（PV）
                </Select.Option>
                <Select.Option key='uv' value='uv'>
                  访客数（UV）
                </Select.Option>
              </Select>
            </>
          ) : null}
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
          loading={listloading}
          size='small'
          rowKey='type'
          dataSource={dataRows}
          columns={columns as any}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
}

export default observer(Refreg);
