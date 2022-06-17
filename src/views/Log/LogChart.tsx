import styles from './LogChart.module.scss';
import { useMemo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { EChartsOption } from '../../utils/echarts';
import { RealtimeData } from '../../utils/types';
import useChart from '../../hooks/useChart';

interface LogChartProps {
  data: RealtimeData;
}

function LogChart({ data }: LogChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chartOption: EChartsOption = useMemo(() => {
    return {
      textStyle: {
        fontFamily: 'MiSans, sans-serif',
      },
      grid: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        show: false,
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      series: [
        {
          data: data.perHour,
          type: 'bar',
          showBackground: true,
        },
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter(params: any) {
          const minute = `${params[0].dataIndex + 1} 分钟前`;
          return `${minute}<br/>${params[0].marker} 访客: ${params[0].value}`;
        },
      },
    };
  }, [data.perHour]);

  useChart(chartRef, chartOption);

  return (
    <div className={styles.container}>
      <div className={styles.mta}>
        <div className={styles.realtime}>
          <div className={styles.realgrid}>
            <span className={styles.realtext}>最近 10 分钟</span>
            <span className={styles.realnum}>{data.tenMins || 0}</span>
          </div>
          <div className={styles.realgrid}>
            <span className={styles.realtext}>最近 1 小时</span>
            <span className={styles.realnum}>{data.oneHour || 0}</span>
          </div>
          <div className={styles.realgrid}>
            <span className={styles.realtext}>最近 24 小时</span>
            <span className={styles.realnum}>{data.halfDay || 0}</span>
          </div>
        </div>
      </div>
      <div className={styles.chart} ref={chartRef}></div>
    </div>
  );
}

export default observer(LogChart);
