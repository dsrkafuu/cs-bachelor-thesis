import styles from './RangesChart.module.scss';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { Dayjs } from '../../../lib/dayjs';
import { EChartsOption } from '../../utils/echarts';
import { VitalsRangesData } from '../../utils/types';
import { api } from '../../utils/axios';
import useChart from '../../hooks/useChart';
import useCurSite from '../../hooks/useCurSite';

interface RangesChartProps {
  times: [Dayjs, Dayjs];
  mode: string;
  mkey: string;
}

function RangesChart({ times, mode, mkey }: RangesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { curSite } = useCurSite();

  const [data, setData] = useState<VitalsRangesData>([]);

  const fetchRanges = useCallback(async () => {
    if (!curSite) {
      return;
    }
    try {
      const res = await api.get(`/metrics/${curSite.id}/vitals/ranges`, {
        params: {
          from: times[0].valueOf(),
          to: times[1].valueOf(),
          mode,
        },
      });
      const newData = res.data as VitalsRangesData;
      setData(newData);
    } catch {
      message.error('获取 Web Vitals 趋势数据失败');
      return;
    }
  }, [curSite, mode, times]);
  useEffect(() => {
    fetchRanges();
  }, [fetchRanges]);

  const chartOption: EChartsOption = useMemo(() => {
    const xAxisData = data.map((item) => item.date);
    const seriesData = data.map((item) => (item as any)[mkey]);

    return {
      textStyle: {
        fontFamily: 'MiSans, sans-serif',
      },
      grid: {
        top: 30,
        bottom: 45,
        left: 70,
        right: 50,
      },
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          data: seriesData,
          type: 'line',
          smooth: true,
        },
      ],
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
