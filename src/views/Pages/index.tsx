import styles from './index.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, message, Pagination, Select, Table } from 'antd';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import Controller from '../../components/layouts/Controller';
import Title from '../../components/miscs/Title';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { PagesData, PagesItem } from '../../utils/types';
import Label from '../../components/basics/Label';
import useTimezone from '../../hooks/useTimezone';
import RangesChart from './RangesChart';
import SingleChart from './SingleChart';

function Pages() {
  const { curSite } = useCurSite();
  const { tz } = useTimezone();

  const [times, setTimes] = useState<[Dayjs, Dayjs]>([
    dayjs('2022-05-15T23:00:00+08:00').startOf('day'),
    dayjs('2022-05-15T23:00:00+08:00').endOf('day'),
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
  const [data, setData] = useState<PagesItem[]>([]);

  const fetchProps = useMemo(() => {
    const _path = `/metrics/${curSite?.id}/pages/list`;
    const params = {
      from: times[0].valueOf(),
      to: times[1].valueOf(),
      tz,
      page,
      pagesize,
      sort,
    } as any;
    path && (params.pathname = path);
    return { path: _path, params };
  }, [curSite?.id, page, pagesize, path, sort, times, tz]);

  const fetchList = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      setListLoading(true);
      const res = await api.get(fetchProps.path, {
        params: fetchProps.params,
      });
      const data = res.data as PagesData;
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
  }, [curSite, fetchProps]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const columns = useMemo(() => {
    return [
      {
        title: '访问路径',
        key: 'pathname',
        render: (record: PagesItem) => <Label>{record.path}</Label>,
      },
      {
        title: '页面标题',
        key: 'status',
        render: (record: PagesItem) => record.title,
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
      {
        title: '入口次数',
        key: 'et',
        dataIndex: 'et',
      },
    ];
  }, []);

  const chartPaths = useMemo(() => {
    return data.map((item) => item.path);
  }, [data]);

  return (
    <div className={styles.container}>
      <Title>受访页面</Title>
      <Controller
        mode='range'
        title='受访页面'
        exporter={fetchProps}
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
          <RangesChart paths={chartPaths} times={times} mkey={sort} />
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

export default observer(Pages);
