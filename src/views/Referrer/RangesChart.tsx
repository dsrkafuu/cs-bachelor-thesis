import styles from './RangesChart.module.scss';
import { observer } from 'mobx-react-lite';
import { EChartsOption } from '../../utils/echarts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReferrerRangesData } from '../../utils/types';
import { Dayjs } from '../../../lib/dayjs';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { message } from 'antd';
import useTimezone from '../../hooks/useTimezone';
import useChart from '../../hooks/useChart';

interface RangesChartProps {
  refs: string[];
  times: [Dayjs, Dayjs];
  mkey: string;
}

function RangesChart({ refs, times, mkey }: RangesChartProps) {
  const { curSite } = useCurSite();
  const { tz } = useTimezone();

  const chartRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ReferrerRangesData>([]);

  const fetchRanges = useCallback(async () => {
    if (!curSite || !refs.length) {
      return;
    }
    try {
      const res = await api.get(`/metrics/${curSite.id}/referrer/ranges`, {
        params: {
          from: times[0].valueOf(),
          to: times[1].valueOf(),
          tz,
          refs: refs.join(','),
        },
      });
      const newData = res.data as ReferrerRangesData;
      if (!newData?.length) {
        return;
      }
      setData(newData);
    } catch {
      message.error('获取访问趋势数据失败');
      return;
    }
  }, [curSite, tz, refs, times]);

  useEffect(() => {
    fetchRanges();
  }, [fetchRanges]);

  const textWidth = useMemo(() => {
    let maxLength = 0;
    data.forEach((item) => {
      if (item.ref.length > maxLength) {
        maxLength = item.ref.length;
      }
    });
    const length = maxLength * 8;
    return length > 300 ? 300 : length;
  }, [data]);

  const chartOption: EChartsOption = useMemo(() => {
    const xAxisData = data[0] ? data[0].ranges.map((item) => item.date) : [];
    const series = data.map((item) => ({
      name: item.ref,
      type: 'line' as const,
      data: item.ranges.map((item) => (item as any)[mkey]),
      smooth: true,
    }));

    return {
      textStyle: {
        fontFamily: 'MiSans, sans-serif',
      },
      grid: {
        top: 24,
        bottom: 48,
        left: 40,
        right: textWidth + 60,
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
          width: textWidth,
          overflow: 'truncate',
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
      },
      yAxis: {
        type: 'value',
      },
      series,
    };
  }, [data, mkey, textWidth]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(RangesChart);
