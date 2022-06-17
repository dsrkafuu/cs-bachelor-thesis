import styles from './index.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { message, Pagination, Radio, Select, Table } from 'antd';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import Controller from '../../components/layouts/Controller';
import Title from '../../components/miscs/Title';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { SystemData, SystemItem } from '../../utils/types';
import useTimezone from '../../hooks/useTimezone';
import RangesChart from './RangesChart';
import SingleChart from './SingleChart';
import PlatformChart from './PlatformChart';

function System() {
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
  const [type, setType] = useState('system|操作系统');
  const handleTypeChange = useCallback((e: any) => {
    setType(e.target.value);
  }, []);
  const [sort, setSort] = useState('pv');
  const handleSortChange = useCallback((v: string) => {
    setSort(v);
  }, []);

  const [listloading, setListLoading] = useState(false);
  const [data, setData] = useState<SystemItem[]>([]);
  const keys = useMemo(() => {
    return data
      .map((item) => item.name)
      .sort()
      .join('|');
  }, [data]);

  const fetchList = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      setListLoading(true);
      const res = await api.get(`/metrics/${curSite.id}/system/list`, {
        params: {
          from: times[0].valueOf(),
          to: times[1].valueOf(),
          type: type.split('|')[0],
          tz,
          page,
          pagesize,
          sort,
        },
      });
      const data = res.data as SystemData;
      if (data.total && !data.data.length) {
        setPage(1);
      }
      setData(data.data);
      setTotal(data.total);
      setListLoading(false);
    } catch {
      message.error('获取系统环境信息失败');
      setListLoading(false);
    }
  }, [curSite, tz, page, pagesize, sort, times, type]);
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const columns = useMemo(() => {
    return [
      {
        title: type.split('|')[1],
        key: 'type',
        dataIndex: 'name',
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
  }, [type]);

  return (
    <div className={styles.container}>
      <Title>系统环境</Title>
      <Controller
        mode='range'
        title='系统环境'
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
        <div className={styles.charts}>
          {times[1].diff(times[0], 'day') >= 1 ? (
            <RangesChart type={type} times={times} mkey={sort} keys={keys} />
          ) : (
            <SingleChart data={data} />
          )}
          <PlatformChart times={times} />
        </div>
        <div className={styles.wrapper}>
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
            <span className={styles.label}>环境类别</span>
            <Radio.Group value={type} onChange={handleTypeChange}>
              <Radio value='system|操作系统'>操作系统</Radio>
              <Radio value='browser|浏览器'>浏览器</Radio>
              <Radio value='screen|屏幕分辨率'>屏幕分辨率</Radio>
              <Radio value='language|用户语言'>用户语言</Radio>
            </Radio.Group>
          </div>
          <Table
            className={styles.table}
            loading={listloading}
            size='small'
            rowKey='name'
            dataSource={data}
            columns={columns as any}
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        </div>
      </div>
    </div>
  );
}

export default observer(System);
