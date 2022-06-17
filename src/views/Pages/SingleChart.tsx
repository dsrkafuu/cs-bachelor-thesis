import styles from './SingleChart.module.scss';
import { observer } from 'mobx-react-lite';
import { useMemo, useRef } from 'react';
import dayjs, { Dayjs } from '../../../lib/dayjs';
import { EChartsOption } from '../../utils/echarts';
import { PagesItem } from '../../utils/types';
import useChart from '../../hooks/useChart';

interface SingleChartProps {
  data: PagesItem[];
  times: [Dayjs, Dayjs];
  mkey: string;
}

function SingleChart({ data, times, mkey }: SingleChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

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
    const series = data.map((item) => ({
      name: item.path,
      type: 'bar' as const,
      data: [(item as any)[mkey]],
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
        trigger: 'item',
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
        data: [dayjs(times[0]).format('YYYY-MM-DD')],
      },
      yAxis: {
        type: 'value',
      },
      series,
    };
  }, [data, mkey, textWidth, times]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(SingleChart);
