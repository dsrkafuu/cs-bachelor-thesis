import styles from './SingleChart.module.scss';
import { observer } from 'mobx-react-lite';
import { EChartsOption } from '../../utils/echarts';
import { useMemo, useRef } from 'react';
import { SystemItem } from '../../utils/types';
import useChart from '../../hooks/useChart';

interface SingleChartProps {
  data: SystemItem[];
}

function SingleChart({ data }: SingleChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chartOption: EChartsOption = useMemo(() => {
    const xAxisData = data.map((item) => item.name);
    const series = [
      {
        name: '访问次数（PV）',
        type: 'bar' as const,
        data: [] as number[],
      },
      {
        name: '访客数（UV）',
        type: 'bar' as const,
        data: [] as number[],
      },
    ];
    data.forEach((item) => {
      series[0].data.push(item.pv);
      series[1].data.push(item.uv);
    });

    return {
      textStyle: {
        fontFamily: 'MiSans, sans-serif',
      },
      grid: {
        top: 24,
        bottom: 48,
        left: 40,
        right: 150,
      },
      tooltip: {
        trigger: 'item',
      },
      legend: {
        orient: 'vertical',
        align: 'left',
        x: 'right',
        y: 'center',
        textStyle: {
          width: 120,
          overflow: 'truncate',
        },
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
      },
      yAxis: {
        type: 'value',
      },
      series,
    };
  }, [data]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(SingleChart);
