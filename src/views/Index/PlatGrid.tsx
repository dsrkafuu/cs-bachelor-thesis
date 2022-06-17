import styles from './PlatGrid.module.scss';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import { message } from 'antd';
import { Dayjs } from '../../../lib/dayjs';
import { EChartsOption } from '../../utils/echarts';
import { fmtPlatform, platform } from '../../utils/format';
import { SystemPlatfromData } from '../../utils/types';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import useTimezone from '../../hooks/useTimezone';
import useChart from '../../hooks/useChart';

interface PlatGridProps {
  time: Dayjs;
}

function PlatGrid({ time }: PlatGridProps) {
  const { curSite } = useCurSite();
  const { tz } = useTimezone();

  const chartRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<SystemPlatfromData>([]);

  const fetchData = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      const res = await api.get(`/metrics/${curSite.id}/system/platform`, {
        params: {
          from: time.startOf('day').valueOf(),
          to: time.endOf('day').valueOf(),
          tz,
        },
      });
      const data = res.data as SystemPlatfromData;
      setData(data);
    } catch {
      message.error('获取设备类型失败');
    }
  }, [curSite, tz, time]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartOption: EChartsOption = useMemo(() => {
    const objectKeys = Object.keys(platform);
    let total = 0;
    const seriesData = [] as any[];
    objectKeys.forEach((key) => {
      const value = data.find((item) => item.p === key)?.pv || 0;
      if (value) {
        total += value;
        seriesData.push({
          name: ' ' + fmtPlatform(key),
          value,
        });
      }
    });
    const pcts = [] as number[];
    seriesData.forEach((item) => {
      const pct = Math.ceil((item.value / total) * 100);
      pcts.push(pct);
    });
    const pctsum = pcts.reduce((a, b) => a + b, 0);
    const minus = 100 - pctsum;
    const maxPctIdx = pcts.indexOf(Math.max(...pcts));
    pcts[maxPctIdx] = pcts[maxPctIdx] + minus;

    return {
      textStyle: {
        fontFamily: 'MiSans, sans-serif',
      },
      tooltip: {
        trigger: 'item',
      },
      series: {
        type: 'pie',
        radius: ['40%', '70%'],
        label: {
          position: 'outer',
          alignTo: 'edge',
          edgeDistance: 16,
        },
        data: seriesData,
      },
    };
  }, [data]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.titlebar}>
        <span className={styles.title}>系统环境</span>
        <Link to='/system'>详情</Link>
      </div>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(PlatGrid);
