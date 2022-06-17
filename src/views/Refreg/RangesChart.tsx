import styles from './RangesChart.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { Dayjs } from '../../../lib/dayjs';
import { EChartsOption } from '../../utils/echarts';
import { RefregRangesData } from '../../utils/types';
import useCurSite from '../../hooks/useCurSite';
import { api } from '../../utils/axios';
import { fmtReferrer, referrer } from '../../utils/format';
import useChart from '../../hooks/useChart';
import useTimezone from '../../hooks/useTimezone';

interface RangesChartProps {
  times: [Dayjs, Dayjs];
  mkey: string;
}

function RangesChart({ times, mkey }: RangesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { curSite } = useCurSite();
  const { tz } = useTimezone();

  const [data, setData] = useState<RefregRangesData>([]);

  const fetchRanges = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      const res = await api.get(`/metrics/${curSite.id}/refreg/ranges`, {
        params: {
          from: times[0].valueOf(),
          to: times[1].valueOf(),
          tz,
        },
      });
      const newData = res.data as RefregRangesData;
      if (!newData?.length) {
        return;
      }
      setData(newData);
    } catch {
      message.error('获取来路情况趋势数据失败');
      return;
    }
  }, [curSite, tz, times]);
  useEffect(() => {
    fetchRanges();
  }, [fetchRanges]);

  const chartOption: EChartsOption = useMemo(() => {
    const refKeys = Object.keys(referrer);
    const xAxisData = data.map((item) => item.date);
    const series = refKeys.map((key) => {
      const arr = data.map((item) => (item as any)[key][mkey]);
      return {
        name: fmtReferrer(key),
        type: 'line' as const,
        data: arr,
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
        right: 110,
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
          width: 100,
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
  }, [data, mkey]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(RangesChart);
