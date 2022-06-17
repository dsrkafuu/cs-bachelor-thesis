import styles from './RefGrid.module.scss';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { message, Spin } from 'antd';
import { observer } from 'mobx-react-lite';
import { Dayjs } from '../../../lib/dayjs';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { ReferrerData, ReferrerItem } from '../../utils/types';

interface RefGridProps {
  time: Dayjs;
}

function RefGrid({ time }: RefGridProps) {
  const { curSite } = useCurSite();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReferrerItem[]>();
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/metrics/${curSite.id}/referrer/list`, {
        params: {
          from: time.startOf('day').valueOf(),
          to: time.endOf('day').valueOf(),
          sort: 'pv',
          page: 1,
          pagesize: 5,
        },
      });
      const data = res.data as ReferrerData;
      let total = 0;
      data.data.forEach((item) => {
        total += item.pv;
      });
      setTotal(total);
      setData(data.data);
      setLoading(false);
    } catch {
      message.error('获取受访页面失败');
      setLoading(false);
    }
  }, [curSite, time]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className={styles.container}>
      <Spin spinning={loading}>
        <div className={styles.titlebar}>
          <span className={styles.title}>来路</span>
          <Link to='/referrer'>详情</Link>
        </div>
        <div className={styles.spanbar}>
          <span>来路网站</span>
          <span>访客数</span>
        </div>
        <div className={styles.list}>
          {data?.map((item) => (
            <Fragment key={item.ref || '直接访问'}>
              <div className={styles.rowtext}>
                <span>{item.ref || '直接访问'}</span>
                <span>{item.pv}</span>
              </div>
              <svg className={styles.rowbar} viewBox='0 0 100 2'>
                <line
                  x1='0'
                  y1='1'
                  x2={`${Math.ceil((item.pv / total) * 100)}`}
                  y2='1'
                  stroke='#7793cc'
                  strokeWidth='2'
                  vectorEffect='non-scaling-stroke'
                />
              </svg>
            </Fragment>
          ))}
        </div>
      </Spin>
    </div>
  );
}

export default observer(RefGrid);
