import styles from './RangesChart.module.scss';
import { observer } from 'mobx-react-lite';
import { EChartsOption } from '../../utils/echarts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SystemRangesData } from '../../utils/types';
import { Dayjs } from '../../../lib/dayjs';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { message } from 'antd';
import useTimezone from '../../hooks/useTimezone';
import useChart from '../../hooks/useChart';

interface RangesChartProps {
  type: string;
  keys: string;
  times: [Dayjs, Dayjs];
  mkey: string;
}

function RangesChart({ type, times, mkey, keys }: RangesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { curSite } = useCurSite();
  const { tz } = useTimezone();

  const [data, setData] = useState<SystemRangesData>([]);

  const fetchRanges = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      const res = await api.get(`/metrics/${curSite.id}/system/ranges`, {
        params: {
          from: times[0].valueOf(),
          to: times[1].valueOf(),
          tz,
          type: type.split('|')[0],
        },
      });
      const newData = res.data as SystemRangesData;
      setData(newData);
    } catch {
      message.error('获取访问趋势数据失败');
      return;
    }
  }, [curSite, tz, times, type]);
  useEffect(() => {
    fetchRanges();
  }, [fetchRanges]);

  const chartOption: EChartsOption = useMemo(() => {
    const _keys = keys.split('|');
    const dates = data.map((item) => item.date);
    const nvMap = {} as { [name: string]: number[] };
    dates.forEach((_, idx) => {
      const arr = mkey === 'pv' ? data[idx].pvs : data[idx].uvs;
      arr.forEach((item) => {
        const name = item.name;
        if (!_keys.includes(name)) {
          return;
        }
        if (!nvMap[name]) {
          nvMap[name] = new Array(dates.length).fill(0);
        }
        nvMap[name][idx] = item.value;
      });
    });
    const series = Object.keys(nvMap).map((key) => {
      return {
        name: key,
        type: 'line' as const,
        data: nvMap[key] || [],
        smooth: true,
      };
    });

    return {
      textStyle: {
        fontFamily: 'MiSans, sans-serif',
      },
      grid: {
        top: 24,
        bottom: 48,
        left: 40,
        right: 140,
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        orient: 'vertical',
        align: 'left',
        x: 'right',
        y: 'center',
        textStyle: {
          overflow: 'truncate',
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
      },
      yAxis: {
        type: 'value',
      },
      series,
    };
  }, [data, keys, mkey]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(RangesChart);
