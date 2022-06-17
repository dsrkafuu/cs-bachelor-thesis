import styles from './index.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { message, Pagination, Select, Table } from 'antd';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import Controller from '../../components/layouts/Controller';
import Title from '../../components/miscs/Title';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { ReferrerData, ReferrerItem } from '../../utils/types';
import Label from '../../components/basics/Label';
import useTimezone from '../../hooks/useTimezone';
import RangesChart from './RangesChart';
import SingleChart from './SingleChart';

function Referrer() {
  const { curSite } = useCurSite();
  const { tz } = useTimezone();

  const [times, setTimes] = useState<[Dayjs, Dayjs]>([
    dayjs('2022-05-15T23:00:00+08:00').subtract(7, 'day').startOf('day'),
    dayjs('2022-05-15T23:00:00+08:00').subtract(1, 'day').endOf('day'),
  ]);
  const handleTimeChange = useCallback((range) => {
    setTimes(range);
  }, []);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pagesize, setPagesize] = useState<number>(5);
  const handlePageChange = useCallback((page: number, pagesize: number) => {
    setPage(page);
    setPagesize(pagesize);
  }, []);

  // filters
  const [sort, setSort] = useState('pv');
  const handleSortChange = useCallback((v: string) => {
    setSort(v);
  }, []);

  const [listloading, setListLoading] = useState(false);
  const [data, setData] = useState<ReferrerItem[]>([]);

  const fetchProps = useMemo(() => {
    const _path = `/metrics/${curSite?.id}/referrer/list`;
    const params = {
      from: times[0].valueOf(),
      to: times[1].valueOf(),
      tz,
      page,
      pagesize,
      sort,
    } as any;
    return { path: _path, params };
  }, [curSite?.id, page, pagesize, sort, times, tz]);

  const fetchList = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      setListLoading(true);
      const res = await api.get(fetchProps.path, {
        params: fetchProps.params,
      });
      const data = res.data as ReferrerData;
      data.data.forEach((item) => {
        if (!item.ref) {
          item.ref = '直接访问';
        }
      });
      if (data.total && !data.data.length) {
        setPage(1);
      }
      setData(data.data);
      setTotal(data.total);
      setListLoading(false);
    } catch {
      message.error('获取受访页面失败');
      setListLoading(false);
    }
  }, [curSite, fetchProps.path, fetchProps.params]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const columns = useMemo(() => {
    return [
      {
        title: '访问路径',
        key: 'pathname',
        render: (record: ReferrerItem) => <Label>{record.ref}</Label>,
      },
      {
        title: '访问次数（PV）',
        key: 'pv',
        dataIndex: 'pv',
      },
      {
        title: '访客数（UV）',
        key: 'uv',
        dataIndex: 'uv',
      },
    ];
  }, []);

  const chartPaths = useMemo(() => {
    return data.map((item) => item.ref);
  }, [data]);

  return (
    <div className={styles.container}>
      <Title>来路情况</Title>
      <Controller
        exporter={fetchProps}
        mode='range'
        title='来路情况'
        value={times}
        onChange={handleTimeChange}
      >
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
      <div className={styles.content}>
        {times[1].diff(times[0], 'day') >= 1 ? (
          <RangesChart refs={chartPaths} times={times} mkey={sort} />
        ) : (
          <SingleChart data={data} times={times} mkey={sort} />
        )}
        <div className={styles.filter}>
          <span className={styles.label}>排序主键</span>
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
        </div>
        <Table
          className={styles.table}
          loading={listloading}
          size='small'
          rowKey='ref'
          dataSource={data}
          columns={columns as any}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
}

export default observer(Referrer);
