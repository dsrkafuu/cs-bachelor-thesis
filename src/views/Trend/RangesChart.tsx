import styles from './RangesChart.module.scss';
import { useMemo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import { EChartsOption } from '../../utils/echarts';
import { TrendData } from '../../utils/types';
import useChart from '../../hooks/useChart';

interface RangesChartProps {
  data: TrendData;
  times: [Dayjs, Dayjs];
  filterd: string[];
}

function RangesChart({ data, times, filterd }: RangesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const diff = useMemo(() => times[1].diff(times[0], 'day'), [times]);

  const filterdData = useMemo(() => {
    if (!filterd || !filterd.length) {
      return data;
    }
    return data.filter((item) => filterd.includes(item.date));
  }, [data, filterd]);

  const chartOption: EChartsOption = useMemo(() => {
    const xAxisData = filterdData.map((item) => {
      if (diff >= 1) {
        return dayjs(`2000-${item.date}`).format('MM-DD');
      } else {
        return dayjs(`2000-01-01 ${item.date}:00`).format('HH:mm');
      }
    });
    const series = [
      {
        name: '访问次数（PV）',
        type: 'line' as const,
        data: filterdData.map((item) => item.pv),
        smooth: true,
      },
      {
        name: '访客数（UV）',
        type: 'line' as const,
        data: filterdData.map((item) => item.uv),
        smooth: true,
      },
      {
        name: '错误数',
        type: 'line' as const,
        data: filterdData.map((item) => item.es),
        smooth: true,
      },
      {
        name: '独立错误',
        type: 'line' as const,
        data: filterdData.map((item) => item.des),
        smooth: true,
      },
      {
        name: 'Web Vitals 数据量',
        type: 'line' as const,
        data: filterdData.map((item) => item.vt),
        smooth: true,
      },
    ];

    const legendData = series.map((item) => item.name);

    return {
      textStyle: {
        fontFamily: 'MiSans, sans-serif',
      },
      grid: {
        top: 24,
        bottom: 48,
        left: 40,
        right: 170,
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: legendData,
        orient: 'vertical',
        align: 'left',
        x: 'right',
        y: 'center',
        textStyle: {
          width: 200,
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
  }, [diff, filterdData]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(RangesChart);
