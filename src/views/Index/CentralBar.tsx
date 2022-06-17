import styles from './CentralBar.module.scss';
import { useCallback, useEffect, useState } from 'react';
import { message, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import useCurSite from '../../hooks/useCurSite';
import { CentralData } from '../../utils/types';
import { api } from '../../utils/axios';
import useTimezone from '../../hooks/useTimezone';

interface CentralBarProps {
  time: Dayjs;
}

function CentralBar({ time }: CentralBarProps) {
  const { curSite } = useCurSite();
  const { tz } = useTimezone();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CentralData | null>(null);
  const [future, setFuture] = useState({ pv: 0, uv: 0 });

  const fetchData = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/metrics/${curSite.id}/index/central`, {
        params: {
          to: time.valueOf(),
          tz,
        },
      });
      const data = res.data as CentralData;
      const now = dayjs().get('hour');
      if (now > 0) {
        const future = {
          pv: Math.ceil((data.today.pv / now) * 24),
          uv: Math.ceil((data.today.uv / now) * 24),
        };
        setFuture(future);
      }
      setData(data);
      setLoading(false);
    } catch {
      message.error('获取核心数据失败');
      setLoading(false);
    }
  }, [curSite, tz, time]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className={styles.container}>
      <Spin spinning={loading}>
        <div className={styles.fifteen}>
          <div>小时平均访客</div>
          <div className={styles.num}>{data?.ds || 0}</div>
          <Link to='/log'>访问记录详情</Link>
        </div>
        <div className={styles.tgrid}>
          <div></div>
          <div>今日</div>
          <div>昨日</div>
          <div>预计今日</div>
          <div>当月</div>
          <div>上月</div>
          <div>总流量</div>
        </div>
        <div className={styles.grid}>
          <div>PV</div>
          <div>{data?.today.pv || 0}</div>
          <div>{data?.lastday.pv || 0}</div>
          <div>{future.pv || 0}</div>
          <div>{data?.month.pv || 0}</div>
          <div>{data?.lastmonth.pv || 0}</div>
          <div>{data?.total.pv || 0}</div>
        </div>
        <div className={styles.grid}>
          <div>UV</div>
          <div>{data?.today.uv || 0}</div>
          <div>{data?.lastday.uv || 0}</div>
          <div>{future.uv || 0}</div>
          <div>{data?.month.uv || 0}</div>
          <div>{data?.lastmonth.uv || 0}</div>
          <div>{data?.total.uv || 0}</div>
        </div>
      </Spin>
    </div>
  );
}

export default observer(CentralBar);
