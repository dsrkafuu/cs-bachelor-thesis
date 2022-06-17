import styles from './RangesChart.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { Dayjs } from '../../../lib/dayjs';
import { EChartsOption } from '../../utils/echarts';
import { PagesRangesData } from '../../utils/types';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import useTimezone from '../../hooks/useTimezone';
import useChart from '../../hooks/useChart';

function compareData(a: PagesRangesData, b: PagesRangesData) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const thisa = a[i];
    const thisb = b.find((item) => item.path === thisa.path);
    if (
      !thisb ||
      JSON.stringify(thisa.ranges) !== JSON.stringify(thisb.ranges)
    ) {
      return false;
    }
  }
  return true;
}

interface RangesChartProps {
  paths: string[];
  times: [Dayjs, Dayjs];
  mkey: string;
}

let lastData: any = [];

function RangesChart({ paths, times, mkey }: RangesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { curSite } = useCurSite();
  const { tz } = useTimezone();

  const [data, setData] = useState<PagesRangesData>([]);

  const fetchRanges = useCallback(async () => {
    if (!curSite || !paths.length) {
      return;
    }
    try {
      const res = await api.get(`/metrics/${curSite.id}/pages/ranges`, {
        params: {
          from: times[0].valueOf(),
          to: times[1].valueOf(),
          tz,
          paths: paths.join(','),
        },
      });
      const newData = res.data as PagesRangesData;
      if (!newData?.length) {
        return;
      }
      if (!compareData(newData, lastData)) {
        lastData = newData;
        setData(newData);
      }
    } catch {
      message.error('获取访问趋势数据失败');
      return;
    }
  }, [curSite, tz, paths, times]);

  useEffect(() => {
    fetchRanges();
  }, [fetchRanges]);

  const textWidth = useMemo(() => {
    let maxLength = 0;
    data.forEach((item) => {
      if (item.path.length > maxLength) {
        maxLength = item.path.length;
      }
    });
    const length = maxLength * 8;
    return length > 300 ? 300 : length;
  }, [data]);

  const chartOption: EChartsOption = useMemo(() => {
    const xAxisData = data[0] ? data[0].ranges.map((item) => item.date) : [];
    const series = data.map((item) => ({
      name: item.path,
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
        right: textWidth + 40,
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
