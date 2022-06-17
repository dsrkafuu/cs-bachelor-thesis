import styles from './SingleChart.module.scss';
import { observer } from 'mobx-react-lite';
import { EChartsOption } from '../../utils/echarts';
import { useMemo, useRef } from 'react';
import { RefregData } from '../../utils/types';
import { fmtReferrer, referrer } from '../../utils/format';
import useChart from '../../hooks/useChart';

interface SingleChartProps {
  data: RefregData | null;
}

function SingleChart({ data }: SingleChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chartOption: EChartsOption = useMemo(() => {
    const objectKeys = Object.keys(referrer);
    const xAxisData = objectKeys.map((key) => fmtReferrer(key));
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
    objectKeys.forEach((key) => {
      const _data = { pv: 0, uv: 0 };
      if (data && (data as any)[key]) {
        _data.pv = (data as any)[key].pv || 0;
        _data.uv = (data as any)[key].uv || 0;
      }
      series[0].data.push(_data.pv);
      series[1].data.push(_data.uv);
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
